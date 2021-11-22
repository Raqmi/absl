odoo.define('i_pos_stock.ProductsWidget', function(require) {
    'use strict';

    const ProductsWidget = require('point_of_sale.ProductsWidget');
    const Registries = require('point_of_sale.Registries');
    
    const ProductsWidgetCustom = ProductsWidget =>
    class extends ProductsWidget {
        /**
         * @override
         */
        
        get productsToDisplay() {
        	const res = super.productsToDisplay;
            if (this.searchWord === '') {
            	if (this.env.pos.config.display_stock_in_pos){
            		this.env.pos.i_change_qty_css();
            	}
            }
            return res;
        }
        
        _switchCategory(event) {
        	$(".debug-widget .toggle").click() //to get stock updates in home page of pos ui
        	if (this.env.pos.config.display_stock_in_pos){
        		this.env.pos.i_change_qty_css();
        	}
        	super._switchCategory(...arguments);
        }
                
    };
    

Registries.Component.extend(ProductsWidget, ProductsWidgetCustom);

return ProductsWidget;

});
