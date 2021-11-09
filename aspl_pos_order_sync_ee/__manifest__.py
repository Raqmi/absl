# -*- coding: utf-8 -*-
#################################################################################
# Author      : Sinergia Systems
#################################################################################
{
    'name': 'Operacion Retail Mayoreo',
    'version': '1.0.1',
    'author': 'Sinergia.',
    'summary': 'POS Sincroniza ventas en caja de Mayoreo',
    'description': "Permite crear ventas y mandarlas a la caja principal para cobro",
    'category': 'Point Of Sale',
    'website': 'http://www.sinergia-e.com',
    'depends': ['base', 'point_of_sale'],
    'price': 499.00,
    'currency': 'MXN',
    'images': [
        'static/description/main_screenshot.png',
    ],
    'data': [
        'views/pos_assets.xml',
        'views/point_of_sale.xml',
        'views/res_users_view.xml'
    ],
    'images': ['static/description/main_screenshot.png'],
    'qweb': [
        'static/src/xml/screens/ChromeWidgets/OrdersIconChrome.xml',
        'static/src/xml/screens/ProductScreen/ControlButtons/OrderScreenButton.xml',
        'static/src/xml/screens/ProductScreen/ProductScreen.xml',
        'static/src/xml/screens/OrderScreen/OrderScreen.xml',
        'static/src/xml/screens/OrderScreen/PopupProductLines.xml',
        'static/src/xml/Popups/CreateDraftOrderPopup.xml',
        'static/src/xml/Popups/ReOrderPopup.xml',
        'static/src/xml/Popups/AuthenticationPopup.xml',
        'static/src/xml/Chrome.xml',
        'static/src/xml/screens/ReceiptScreen/OrderReceipt.xml',
    ],
    'installable': True,
    'auto_install': False,
}
# vim:expandtab:smartindent:tabstop=4:softtabstop=4:shiftwidth=4:
