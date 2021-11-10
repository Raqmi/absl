# -*- coding: utf-8 -*-
# Part of Softhealer Technologies.
{
    "name":   "POS Close Session Report",
    "author": "Softhealer Technologies",
    "license": "OPL-1",
    "website": "https://www.softhealer.com",
    "support": "support@softhealer.com",
    "category": "Point Of Sale",
    "summary": """print point of sale detail, pos information report app, pos close session detail, close session report validate, daily pos session module, point of sale session manage, pos close session report odoo """,
    "description": """ Do you want to get all the information about your POS session? So here we create a beautiful module that can help to print all information (like Cash control, Payment Summary, Cash In/Out movement, etc..) about your POS session in the single PDF report. print point of sale detail, pos information report app, pos close session detail, close session report validate, daily pos session module, point of sale session manage, pos close session report odoo""",

    "version": "15.0.1",
    "depends": ["base", "point_of_sale"],
    "application": True,
    "data": [
        "views/session_view.xml",
        "report/pos_close_session_report.xml",
    ],
    "images": ["static/description/background.jpg", ],
    "auto_install": False,
    "installable": True,
    "price": 50,
    "currency": "EUR"
}
