# -*- coding: utf-8 -*-
#################################################################################
#################################################################################

from odoo import fields, models, api


class ResUsers(models.Model):
    _inherit = 'res.users'

    pos_user_type = fields.Selection([('cashier', 'Cajero Mayoreo/Supervisor POS'), ('salesman', 'Vendedor mostrador de mayoreo')], string="Tipo de usuario Mayoreo",default='salesman')
    can_give_discount = fields.Boolean("Puede dar descuento")
    can_change_price = fields.Boolean("Puede cambiar precio")
    discount_limit = fields.Float("Limite de descuento")
    based_on = fields.Selection([('pin', 'Pin'), ('barcode', 'Barcode')],default='pin', string="Autentificar al gerente con: ")
    sales_persons = fields.Many2many('res.users', 'sales_person_rel', 'sales_person_id', 'user_id',string='Vendedores')
    custom_security_pin = fields.Char(string="Pin de seguridad")

    @api.model
    def name_search(self, name, args=None, operator='ilike', limit=100):
        if self._context.get('from_sales_person'):
            users = []
            pos_users_ids = self.env.ref('point_of_sale.group_pos_user').users.ids
            sale_person_ids = self.search([('id', 'in', pos_users_ids),('pos_user_type', '=', 'salesman')])
            selected_sales_persons = []
            for user in pos_users_ids:
                user_id = self.browse(user)
                if user_id.sales_persons:
                    selected_sales_persons.append(user_id.sales_persons.ids)
            if sale_person_ids:
                users.append(sale_person_ids.ids)
            if users:
                args += [['id', 'in', users[0]]]
            if selected_sales_persons:
                args += [['id', 'not in', selected_sales_persons[0]]]
        return super(ResUsers, self).name_search(name, args=args, operator=operator, limit=limit)

# vim:expandtab:smartindent:tabstop=4:softtabstop=4:shiftwidth=4: