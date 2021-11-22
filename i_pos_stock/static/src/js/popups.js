odoo.define('i_pos_stock.popups', function(require) {
	"use strict";
	
    const AbstractAwaitablePopup = require('point_of_sale.AbstractAwaitablePopup');
    const Registries = require('point_of_sale.Registries');
    
    class OutOfStockPopupMessage extends AbstractAwaitablePopup {
        mounted() {
            this.playSound('');
        }
    }
    
    OutOfStockPopupMessage.template = 'OutOfStockPopupMessage';
    OutOfStockPopupMessage.defaultProps = {
        confirmText: 'Ok',
        title: 'Warning!',
        body: '',
    };

    Registries.Component.add(OutOfStockPopupMessage);    
    return OutOfStockPopupMessage;
});