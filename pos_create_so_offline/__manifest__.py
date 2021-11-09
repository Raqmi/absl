# -*- coding: utf-8 -*-

{
    'name': 'POS Pedidos de ruta',
    'version': '1.0',
    'category': 'Point of Sale',
    'sequence': 6,
    'author': 'Sinergy Systems',
    'summary': "Permite levantar pedidos offline para vendedores de ruta." ,
    'description': "Permite levantar pedidos offline para vendedores de ruta.",
    'depends': ['point_of_sale','sale'],
    'data': [
        # 'security/ir.model.access.csv',
        'views/views.xml',
        'views/templates.xml',
        # 'views/sequence.xml',
    ],
    'qweb': [
        'static/src/xml/pos.xml',
    ],
    'images': [
        'static/description/banner.jpg',
    ],
    'installable': True,
    'website': '',
    'auto_install': False,
    'price': 2000,
    'currency': 'MXN',
}
