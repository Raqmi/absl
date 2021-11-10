# -*- coding: utf-8 -*-
# Copyright (C) Softhealer Technologies.

from odoo import models, fields, api


class Session(models.Model):
    _inherit = 'pos.session'

    ticket_num = fields.Integer(
        compute="_compute_get_ticket_num", string="Ticket No")
    first_ticket = fields.Many2one(
        compute="_compute_get_first_ticket", string="First Ticket", comodel_name="pos.order")
    last_ticket = fields.Many2one(
        compute="_get_last_ticket", string="Last Ticket", comodel_name="pos.order")
    total_disc = fields.Float(compute="_compute_get_total", string="Total")

    def _compute_get_total(self):
        dis = 0.0
        for pos in self:
            pos.total_disc = 0.0
            for data in pos.order_ids:
                for line in data.lines:
                    tot_disc = line.discount * \
                        (line.price_unit * line.qty) / 100
                    dis += tot_disc
            pos.total_disc = dis

    def _compute_get_ticket_num(self):
        self.ticket_num = 0
        for pos in self: 
            if pos.order_ids:
                pos.ticket_num = len(pos.order_ids.ids)

    def _compute_get_first_ticket(self):
        self.first_ticket = 0
        for pos in self:
            if pos.order_ids:
                pos.first_ticket = pos.order_ids.ids[-1]

    def _get_last_ticket(self):
        self.last_ticket = 0
        for pos in self:
            if pos.order_ids:
                pos.last_ticket = pos.order_ids.ids[0]

    def summary_by_tax(self):

        account_tax_obj = self.env['account.tax']
        res = {}  # tax_id -> data

        for order in self.order_ids:
            for line in order.lines:
                taxes = line.tax_ids.filtered(
                    lambda t: t.company_id.id == line.order_id.company_id.id)
                price = line.price_unit * (1 - (line.discount or 0.0) / 100.0)
                taxes = taxes.compute_all(price, line.order_id.pricelist_id.currency_id, line.qty,
                                          product=line.product_id, partner=line.order_id.partner_id or False)['taxes']
                for tax in taxes:
                    id = tax['id']
                    if id not in res:
                        t = account_tax_obj.browse(id)
                        tax_rule = ''
                        if t.amount_type == 'percent':
                            tax_rule = str(100 * t.amount) + '%'
                        else:
                            tax_rule = str(t.amount)
                        res[id] = {'name': tax['name'],
                                   'base': 0,
                                   'tax': tax_rule,
                                   'total': 0,
                                   }
                    res[id]['base'] += price * line.qty
                    res[id]['total'] += tax['amount']
        return res.values()


class AccountBankStatementLine(models.Model):
    _inherit = 'account.bank.statement.line'

    cash_in_out = fields.Selection([('cash_in', 'Cash In'),
                                    ('cash_out', 'Cash Out')],
                                   string='Cash In/Out',)

    @api.model
    def create(self, vals):
        if self.env.context.get('active_model', False) and self.env.context.get('active_model') == "pos.session":

            if vals.get('amount') > 0:
                vals.update({'cash_in_out': 'cash_in'})
            elif vals.get('amount') < 0:
                vals.update({'cash_in_out': 'cash_out'})

        res = super(AccountBankStatementLine, self).create(vals)
        return res
