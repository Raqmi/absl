odoo.define('i_pos_stock.OrderListScreenWidget', function(require) {
    'use strict';

    const PosComponent = require('point_of_sale.PosComponent');
    const Registries = require('point_of_sale.Registries');
    const { useListener } = require('web.custom_hooks');
    const { Gui } = require('point_of_sale.Gui');
    const { debounce } = owl.utils;
    var core = require('web.core');
    var QWeb = core.qweb;
    var field_utils = require('web.field_utils');
    
    
 // Low Stock Product list
    class LowStockProductsButton extends PosComponent {
	async onClickStock() {
	    await this.showTempScreen('LowStockProductsScreen',{'products' : this.env.pos.get('low_stock_products')});
        }
        
    };
    LowStockProductsButton.template = 'LowStockProductsButton';

    Registries.Component.add(LowStockProductsButton);
    
    class LowStockProductsScreen extends PosComponent {
        constructor() {
            super(...arguments);
            this.state = {
                query: null,
            };
        }

        back() {
            this.trigger('close-temp-screen');
        }
       
       
        updateProductList(event) {
            this.state.query = event.target.value;
            var products;
            if(this.state.query){
        	products = this.search_products(this.state.query);
                this.render_list(products);
            }else{
        	products = this.env.pos.get('low_stock_products');
                this.render_list(products);
            }            
        }
        
        search_products(query){
        	try {
        		var re = RegExp(query, 'i');
                
            }catch(e){
                return [];
            }
            var results = [];
            for (var product_id in this.env.pos.get('low_stock_products')){
                var r = re.exec(this.env.pos.get('low_stock_products')[product_id]['display_name']); 
                if(r){
                	results.push(this.env.pos.get('low_stock_products')[product_id]);
                }
            }
            return results;
        }
        
        render_list(products){
            var contents = this.el.querySelector('.client-list-contents');
            var Length = products.length;
            contents.innerHTML = "";
            if (this.state.query){
            	Length = products.length;
        	}else{
        		if (products.length == undefined){
        			Length = Object.keys(products).length;
        		}
        	}
            for(var i = 0, len = Math.min(Length,1000); i < len; i++){
                var product    = products[i];
                var table = document.getElementById("client-list").getElementsByTagName('tbody')[0];
                var rowCount = table.rows.length;
                var row = table.insertRow(rowCount);
                row.className = 'order-line';
                row.setAttribute("data-id", product.id);
              //Column 1  
                var cell1 = row.insertCell(0);  
                cell1.innerHTML = product.display_name;
              //Column 2
                var cell2 = row.insertCell(1);  
                cell2.innerHTML = product.qty_available;
              

            }

        }
    
    };
    LowStockProductsScreen.template = 'LowStockProductsScreen';

    Registries.Component.add(LowStockProductsScreen);
    
    return LowStockProductsButton, LowStockProductsScreen;
});
