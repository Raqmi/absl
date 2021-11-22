odoo.define('i_pos_stock.Chrome', function(require) {
    'use strict';

    const Chrome = require('point_of_sale.Chrome');
    const Registries = require('point_of_sale.Registries');
    
    const ChromeCustom = Chrome =>
    class extends Chrome {
    	async start() {
            await super.start();
            if (this.env.pos.config.display_stock_in_pos){
            	this._i_change_qty_css();
            }
        }
    	
    	_setScreenData(name, props) {
            if (this.env.pos.config.display_stock_in_pos){
            	this._i_change_qty_css();
            }
            super._setScreenData(...arguments);
        }
    	
    	_i_change_qty_css() {
			self = this;
			var ic_order = this.env.pos.get('orders');
			var ic_p_qty = new Array();
			var ic_product_obj = this.env.pos.get('product_stock_qtys');
			if (ic_order) {
				for ( var i in ic_product_obj)
					ic_p_qty[i] = this.env.pos.get('product_stock_qtys')[i];
				for (var i = 0; i < ic_order.length; i++) {
					if (!ic_order.models[i].is_return_order) {
						var i_order_line = ic_order.models[i]
								.get_orderlines();
						for (var j = 0; j < i_order_line.length; j++) {
							if (!i_order_line[j].stock_location_id)
								ic_p_qty[i_order_line[j].product.id] = ic_p_qty[i_order_line[j].product.id]
										- i_order_line[j].quantity;
							var qty = ic_p_qty[i_order_line[j].product.id];
							
							if (qty > this.env.pos.config.deny_order){
								$("#qty-tag-"+ i_order_line[j].product.id).html(qty);
								$("#qty-tag-"+ i_order_line[j].product.id).removeClass("not-available");
							}
							else{
								$("#qty-tag-"+ i_order_line[j].product.id).html(qty);
								$("#qty-tag-"+ i_order_line[j].product.id).addClass("not-available");
							}//end of else
						}
					}
				}
			}
		}
    	
    };
    Registries.Component.extend(Chrome, ChromeCustom);

    return Chrome;
    
});
