# -*- coding: utf-8 -*-
#odoo14
{
    "name": "POS Stock Odoo",
	"category": "Point of Sale",
	'version': '1.0', 
	
    "summary": "controla el stock en el modulo POS",
    'description': "Muestra existencias y controla el stock",
	'license': 'OPL-1',
    'price': 00.00,
	'currency': 'MXN',
	
	'author': "Sinergy Sistems",
    'website': "https://www.sinergia-e.com",
    'support':  'alejandro.avila@sinergia-e.com',
    'maintainer': 'Sinergia',
	
    "images": ['static/description/icono.png'],
    
	# Dependencias
	"depends": ["point_of_sale", "stock"],
	# siempre cargar 
    "data": [
        "views/pos_config_view.xml",
    ],
    "qweb": ["static/src/xml/pos.xml",
    ],
    "application": False,
    "installable": True,
}