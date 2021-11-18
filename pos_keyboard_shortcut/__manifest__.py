# -*- coding: utf-8 -*-
#################################################################################
# Author      : Sinergia
#################################################################################
{
  "name"                 :  "POS Keyboard Shortcuts",
  "summary"              :  """Super Barato shortcuts.""",
  "category"             :  "Point of Sale",
  "version"              :  "1.1.1",
  "author"               :  "Sinergia-e",
  "license"              :  "Other proprietary",
  "website"              :  "www.sinergia-e.com",
  "description"          :  """shortCuts para Reatil Super Barato""",
  "live_test_url"        :  "",
  "depends"              :  ['point_of_sale'],
  "data"                 :  [
                             'security/ir.model.access.csv',
                             'views/pos_keyboard_shortcuts_view.xml',
                             'views/pos_config_view.xml',
                             'views/template.xml',
                            ],
  "demo"                 :  ['demo/demo.xml'],
  "application"          :  True,
  "installable"          :  True,
  "auto_install"         :  False,
  "pre_init_hook"        :  "pre_init_check",
}