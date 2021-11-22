# -*- coding: utf-8 -*-
from odoo import models, fields, api, _
import pytz
import string, random, datetime
from itertools import product
from odoo.exceptions import UserError, ValidationError
from odoo.tools import float_is_zero

class PosConfig(models.Model):
    _inherit = 'pos.config'
    
    display_stock_in_pos = fields.Boolean(
        "Display Stock in POS", help="Show Product Qty in POS", default=True
    )
    hide_outofstock_prod = fields.Boolean("Hide out of stock products", default=True)
    stock_type = fields.Selection([("qty_available","Available Quantity(on hand)"),("forecasted_qty","Forecasted Quantity"),
                                   ("onhand_minus_out","Quantity on Hand - Outgoing Qty")],default="qty_available")
    allow_order = fields.Boolean("Allow Order When Out-of-Stock")
    custom_msg = fields.Char("Custom Message",default="Product out of stock")
    deny_order = fields.Integer("Deny Order When product stock is equal to")
    select_location_type = fields.Selection([('all','All Warehouse'),('specific','Current Session Warehouse')],default='all',string="Select Stock Location")
    select_location_id = fields.Many2one('stock.location',string="Stock Location")
    
    def get_product_by_stock_location_id(self,config_id):
        PosConfig = self.env['pos.config'].search([('id','=',config_id)])
        data = {}
        if PosConfig.select_location_type == 'specific':
            products = self.env['product.product'].search([('available_in_pos','=',True)])
            for prod in products:
                SrockQuant = self.env['stock.quant'].search([('product_id','=',prod.id),('location_id','=',PosConfig.select_location_id.id)])
                if prod.type == "product": 
                    if SrockQuant:
                        data.update({prod.id:
                                     {PosConfig.select_location_id.id : SrockQuant.quantity}
                                })
                    else:
                        data.update({prod.id:
                                         {PosConfig.select_location_id.id : 0.00}
                                    })                           
                else:
                    data.update({prod.id:
                                         {PosConfig.select_location_id.id : 0.00}
                                    })
                    
        return data
    
    def get_pos_stock(self,stock_type,hide_outofstock_prod,config_id):
        PosConfig = self.env['pos.config'].search([('id','=',config_id)])
        
        data = {}
        if PosConfig.select_location_type == 'all':
            products = self.env['product.product'].search([('available_in_pos','=',True)])
            if hide_outofstock_prod:
                if stock_type == "qty_available":
                    for prod in products:
                        if prod.type == "product": 
                            if  prod.qty_available > PosConfig.deny_order:
                                data.update({prod.id:prod.qty_available})
                        else:
                            data.update({prod.id:0.00})
                if stock_type == "forecasted_qty":
                    for prod in products:
                        if prod.type == "product": 
                            if  prod.virtual_available > PosConfig.deny_order:
                                data.update({prod.id:prod.virtual_available})
                        else:
                            data.update({prod.id:0.00})
                if stock_type == "onhand_minus_out":
                    for prod in products:
                        if prod.type == "product": 
                            if prod.qty_available - prod.outgoing_qty > PosConfig.deny_order:
                                data.update({prod.id:prod.qty_available - prod.outgoing_qty})
                        else:
                            data.update({prod.id:0.00})
            else:
                if stock_type == "qty_available":
                    for prod in products:
                        if prod.type == "product":
                            data.update({prod.id:prod.qty_available})
                        else:
                            data.update({prod.id:0.00})
                if stock_type == "forecasted_qty":
                    for prod in products:
                        if prod.type == "product":
                            data.update({prod.id:prod.virtual_available})
                        else:
                            data.update({prod.id:0.00})
                if stock_type == "onhand_minus_out":
                    for prod in products:
                        if prod.type == "product":
                            data.update({prod.id:prod.qty_available - prod.outgoing_qty})
                        else:
                            data.update({prod.id:0.00})
        else:
            products = self.env['product.product'].search([('available_in_pos','=',True)])
            if hide_outofstock_prod:
                for prod in products:
                    SrockQuant = self.env['stock.quant'].search([('product_id','=',prod.id),('location_id','=',PosConfig.select_location_id.id)])
                    if prod.type == "product": 
                        if SrockQuant:
                            if  SrockQuant.quantity > PosConfig.deny_order:
                                data.update({prod.id:SrockQuant.quantity})
                        else:
                            data.update({prod.id:0.00})                           
                    else:
                        data.update({prod.id:0.00})
            else:
                for prod in products:
                    SrockQuant = self.env['stock.quant'].search([('product_id','=',prod.id),('location_id','=',PosConfig.select_location_id.id)])
                    if prod.type == "product":
                        if SrockQuant:
                            data.update({prod.id:SrockQuant.quantity})
                        else:
                            data.update({prod.id:0.00})
                    else:
                        data.update({prod.id:0.00})
        return data
    
    
    
class PosOrder(models.Model):
    _inherit = 'pos.order'
    
    #method overwrite to get change in stock directly when order is created from pos ui
    def _create_order_picking(self):
        self.ensure_one()
        picking_type = self.config_id.picking_type_id
        if self.partner_id.property_stock_customer:
            destination_id = self.partner_id.property_stock_customer.id
        elif not picking_type or not picking_type.default_location_dest_id:
            destination_id = self.env['stock.warehouse']._get_partner_locations()[0].id
        else:
            destination_id = picking_type.default_location_dest_id.id

        pickings = self.env['stock.picking']._create_picking_from_pos_order_lines(destination_id, self.lines, picking_type, self.partner_id)
        pickings.write({'pos_session_id': self.session_id.id, 'pos_order_id': self.id, 'origin': self.name})
        
    
    def get_details(self, ref):
        order_id = self.env['pos.order'].sudo().search([('pos_reference', '=', ref)], limit=1)
        return order_id.ids


    
class StockPicking(models.Model):
    _inherit='stock.picking'
    
    @api.model
    def _create_picking_from_pos_order_lines(self, location_dest_id, lines, picking_type, partner=False):
        """We'll create some picking based on order_lines"""
        
        pickings = self.env['stock.picking']
        stockable_lines = lines.filtered(lambda l: l.product_id.type in ['product', 'consu'] and not float_is_zero(l.qty, precision_rounding=l.product_id.uom_id.rounding))
        if not stockable_lines:
            return pickings
        positive_lines = stockable_lines.filtered(lambda l: l.qty > 0)
        negative_lines = stockable_lines - positive_lines

        if positive_lines:
            ###custom
            session_id = False
            for line in lines:
                session_id = line.order_id.session_id.id
             
            config_id = False   
            if session_id:
                current_session = self.env['pos.session'].browse(session_id)  
                config_id = current_session.config_id.id
            configObj = self.env['pos.config']
            if config_id:   
                configObj = self.env['pos.config'].browse(config_id)
            if configObj:
                if configObj.select_location_type == "specific":
                    location_id = configObj.select_location_id.id
                else:
                    location_id = picking_type.default_location_src_id.id
            else:
                location_id = picking_type.default_location_src_id.id
            ###end custom
            positive_picking = self.env['stock.picking'].create(
                self._prepare_picking_vals(partner, picking_type, location_id, location_dest_id)
            )

            positive_picking._create_move_from_pos_order_lines(positive_lines)
            try:
                with self.env.cr.savepoint():
                    positive_picking._action_done()
            except (UserError, ValidationError):
                pass

            pickings |= positive_picking
        if negative_lines:
            if picking_type.return_picking_type_id:
                return_picking_type = picking_type.return_picking_type_id
                return_location_id = return_picking_type.default_location_dest_id.id
            else:
                return_picking_type = picking_type
                return_location_id = picking_type.default_location_src_id.id

            negative_picking = self.env['stock.picking'].create(
                self._prepare_picking_vals(partner, return_picking_type, location_dest_id, return_location_id)
            )
            negative_picking._create_move_from_pos_order_lines(negative_lines)
            try:
                with self.env.cr.savepoint():
                    negative_picking._action_done()
            except (UserError, ValidationError):
                pass
            pickings |= negative_picking
        return pickings

class ProductProduct(models.Model):
    _inherit = 'product.product'
    
    def get_allowed_product_qty(self,product_id,config_id):
        allowed = 0
        qty_available = 0
        deny_order = 0
        custom_msg = ""
        if product_id:
            PosConfig = self.env['pos.config'].sudo().search([('id','=',config_id)])
            deny_order = PosConfig.deny_order
            custom_msg = PosConfig.custom_msg
            product = self.env['product.product'].sudo().browse(product_id)
            SrockQuant = self.env['stock.quant'].search([('product_id','=',product.id),('location_id','=',PosConfig.select_location_id.id)])
            if product.type == "product":
                if SrockQuant:
                    qty_available = SrockQuant.quantity
                    
                    if SrockQuant.quantity > PosConfig.deny_order:
                        allowed = SrockQuant.quantity - PosConfig.deny_order
                    else:
                        allowed = 0
                else:
                    qty_available = 0
                    allowed = 0
            else:
                qty_available = 0
                allowed = 0
        else:
            qty_available = 0
            allowed = 0
        return [allowed, qty_available,deny_order ,custom_msg]
    
    