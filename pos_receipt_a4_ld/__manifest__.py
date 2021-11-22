# -*- coding: utf-8 -*-
# Part of Lebowski. See LICENSE file for full copyright and licensing details.

{
    'name': 'Pos Receipt A4',
    'version': '1.0',
    'sequence': 3,
    'author': 'Lebowski',
    'company': 'Lebowski',
    'license': 'OPL-1',
    'category': 'Sales/Point of Sale',
    'summary': 'Elegant A4 Pos Receipt ',
    'description': """
    Print A4 receipt inside POS
    ===========================
    
    Option to print A4 receipt alongside your old receipt
    Option to set A4 receipt as the default receipt
    Option to render Barcode or Qrcode code in A4 receipt
    
    """,
    'depends': ['point_of_sale'],
    'data': [
        'views/assets.xml',
        'views/pos_config_view.xml',
    ],
    'qweb': [
        'static/src/xml/pos.xml',
    ],
    "images": ['static/description/thumbnail.gif'],
    "price": 72,
    "currency": 'USD',
    'application': True,
    'installable': True,
}
