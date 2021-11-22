odoo.define("i_pos_stock.PosModel", function(require) {
	"use strict";

	var rpc = require("web.rpc");
	var models = require("point_of_sale.models");
	var field_utils = require("web.field_utils");
	var core = require('web.core');
	var model_list = models.PosModel.prototype.models
	var SuperOrder = models.Order.prototype;
	var SuperPosModel = models.PosModel.prototype;
	var SuperOrderline = models.Orderline.prototype;
	var product_model = null;
	const {
		Gui
	} = require('point_of_sale.Gui');
	var utils = require('web.utils');
	var round_pr = utils.round_precision;
	var round_di = utils.round_decimals;
	var _t = core._t;
	
	models.load_fields("product.product", ["qty_available", "type", "virtual_available", "incoming_qty", "outgoing_qty"]);
	
	models.load_models({
		model: 'pos.config',
		loaded: function(self) {
			rpc.query({
					model: 'pos.config',
					method: 'get_product_by_stock_location_id',
					args: [
						[self.config.id], self.config.id
					]
				})
				.then(
					function(result) {
					    self
						.set({
							'product_by_stock_location_id': result
						});
					});
		}
	});
	
	models.load_models([{
		label: 'Loading Product Stock',
		loaded: function(self) {
			rpc
				.query({
					model: 'pos.config',
					method: 'get_pos_stock',
					args: [
						[self.config.id], self.config.stock_type, self.config.hide_outofstock_prod, self.config.id
					]

				})
				.then(
					function(result) {
						self
							.set({
								'product_stock_qtys': result
							});
						console.log("ssssssssss-------------",result);
						self.db.product_stock_qtys = result;
						self.db.hide_outofstock_prod = self.config.hide_outofstock_prod;
					});
		}
	}], {
		'before': 'product.product'
	});
	
	for (var i = 0, len = model_list.length; i < len; i++) {
		if (model_list[i].model == "product.product") {
			product_model = model_list[i];
			break;
		}
	}
	
	var super_product_loaded = product_model.loaded;
	product_model.context = function(self) {
	    if (self.config.display_stock_in_pos &&
			self.config.select_location_type === 'specific'){ 
		return {
			location: self.config.select_location_id[0]
		};
	    }
	}
	product_model.loaded = function(self, products) {
	    	var unavailable_product = [];
		if (self.config.display_stock_in_pos &&
			self.config.hide_outofstock_prod) {
			var available_product = [];
			for (var i = 0, len = products.length; i < len; i++) {
				
			    switch (self.config.stock_type) {
				case 'forecasted_qty':
					if (products[i].virtual_available > self.config.deny_order ||
						products[i].type == 'service' || products[i].type == 'consu'){
						available_product.push(products[i]);
					}
					if (products[i].virtual_available <= self.config.deny_order &&
						products[i].type == 'product') {
					    unavailable_product.push(products[i]);
					}
					break;
				case 'onhand_minus_out':
					if ((products[i].qty_available - products[i].outgoing_qty) > self.config.deny_order ||
						products[i].type == 'service' || products[i].type == 'consu'){
						available_product.push(products[i]);
					}
					if ((products[i].qty_available - products[i].outgoing_qty) <= self.config.deny_order &&
						products[i].type == 'product') {
					    unavailable_product.push(products[i]);
					}
					break;
				default:
					if (products[i].qty_available > self.config.deny_order ||
						products[i].type == 'service' || products[i].type == 'consu') {
						available_product.push(products[i]);
					}
					if (products[i].qty_available <= self.config.deny_order &&
						products[i].type == 'product') {
					    unavailable_product.push(products[i]);
					}
			    }
			}
			products = available_product;
		}
		var results = {}
		for (var i = 0, len = products.length; i < len; i++) {
			switch (self.config.stock_type) {
				case 'qty_available':
					results[products[i].id] = products[i].qty_available
					if (self.config.display_stock_in_pos &&
						!self.config.hide_outofstock_prod){
        					if (products[i].qty_available <= self.config.deny_order &&
        						products[i].type == 'product') {
        					    unavailable_product.push(products[i]);
        					}
					}
					break;
				case 'forecasted_qty':
					results[products[i].id] = products[i].virtual_available
					if (self.config.display_stock_in_pos &&
						!self.config.hide_outofstock_prod){
        					if (products[i].virtual_available <= self.config.deny_order &&
        						products[i].type == 'product') {
        					    unavailable_product.push(products[i]);
        					}
					}
					break;
				default:
					results[products[i].id] = products[i].qty_available - products[i].outgoing_qty
					if (self.config.display_stock_in_pos &&
						!self.config.hide_outofstock_prod){
        					if ((products[i].qty_available - products[i].outgoing_qty) <= self.config.deny_order &&
        						products[i].type == 'product') {
        					    unavailable_product.push(products[i]);
        					}
					}
			}
		}
		self.set({
			'low_stock_products': unavailable_product
		});
		
		self.set({
			'product_stock_qtys': results
		});
		self.db.product_stock_qtys = results;
		self.i_change_qty_css();
		super_product_loaded.call(this, self, products);
	};

	models.PosModel = models.PosModel
		.extend({
			push_and_invoice_order: function(order) {
				var self = this;
				if (order != undefined) {
					if (!order.is_return_order) {
						var i_order_line = order
							.get_orderlines();
						for (var j = 0; j < i_order_line.length; j++) {
							self.get('product_stock_qtys')[i_order_line[j].product.id] = self
								.get('product_stock_qtys')[i_order_line[j].product.id] -
								i_order_line[j].quantity;
						}
					} else {
						var i_order_line = order
							.get_orderlines();
						for (var j = 0; j < i_order_line.length; j++) {
							self.get('product_stock_qtys')[i_order_line[j].product.id] = self
								.get('product_stock_qtys')[i_order_line[j].product.id] +
								i_order_line[j].quantity;
						}
					}
				}
				var push = SuperPosModel.push_and_invoice_order
					.call(this, order);
				return push;
			},
			push_orders: function(order, opts) {
				var pushed = SuperPosModel.push_orders.call(this, order, opts);
				if (order) {
					this.update_product_qty_from_order_lines(order);
				}
				var self = this;
				if (order != undefined) {
					if (!order.is_return_order) {
						var i_order_line = order
							.get_orderlines();
						for (var j = 0; j < i_order_line.length; j++) {
							if (!i_order_line[j].stock_location_id)
								self.get('product_stock_qtys')[i_order_line[j].product.id] = self
								.get('product_stock_qtys')[i_order_line[j].product.id] -
								i_order_line[j].quantity;
						}
					} else {
						var i_order_line = order
							.get_orderlines();
						for (var j = 0; j < i_order_line.length; j++) {
							self.get('product_stock_qtys')[i_order_line[j].product.id] = self
								.get('product_stock_qtys')[i_order_line[j].product.id] +
								i_order_line[j].quantity;
						}
					}
				}
				return pushed;
			},

			push_single_order: function(order, opts) {
				var pushed_single_order = SuperPosModel.push_single_order.call(this, order, opts);
				if (order) {
					this.update_product_qty_from_order_lines(order);
				}
				var self = this;
				if (order != undefined) {
					if (!order.is_return_order) {
						var i_order_line = order
							.get_orderlines();
						for (var j = 0; j < i_order_line.length; j++) {
							if (!i_order_line[j].stock_location_id)
								self.get('product_stock_qtys')[i_order_line[j].product.id] = self
								.get('product_stock_qtys')[i_order_line[j].product.id] -
								i_order_line[j].quantity;
						}
					} else {
						var i_order_line = order
							.get_orderlines();
						for (var j = 0; j < i_order_line.length; j++) {
							self.get('product_stock_qtys')[i_order_line[j].product.id] = self
								.get('product_stock_qtys')[i_order_line[j].product.id] +
								i_order_line[j].quantity;
						}
					}
				}
				return pushed_single_order;
			},

			refresh_qty_available: function(product) {
				const self = this;

				var $elem = $("[data-product-id='" + product.id + "'] .qty-tag");
				$elem.html(product.rounded_qty());
				if (product.qty_available <= self.config.deny_order && !$elem.hasClass("not-available")) {
					$elem.addClass("not-available");
				}
			},
			update_product_qty_from_order_lines: function(order) {
				const self = this;
				order.orderlines.each(function(line) {
					var product = line.get_product();
					product.qty_available = product.format_float_value(
						product.qty_available - line.get_quantity(), {
							digits: [69, 3]
						}
					);
					self.refresh_qty_available(product);
				});
				// Compatibility with pos_multi_session
				order.trigger("new_updates_to_send");
			},

			get_QtyStr: function(qty) {
				if (qty) {
					return qty.toFixed(2);
				}
			},

			set_stock_qtys: function(result) {
				var self = this;
				if (!self.chrome.screens) {
					$.unblockUI();
					return;
				}
				self.chrome.screens.products.product_categories_widget
					.reset_category();
				var all = $('.product');
				$.each(all, function(index, value) {
					var product_id = $(value).data(
						'product-id');
					var stock_qty = result[product_id];
					$(value).find('.qty-tag').html(
						stock_qty);
				});
				$.unblockUI();
			},
			get_information: function(i_product_id) {
				self = this;
				if (self.get('product_stock_qtys'))
					return self.get('product_stock_qtys')[i_product_id];
			},
			i_change_qty_css: function() {
				self = this;
				var ic_order = this.get('orders');
				var ic_p_qty = new Array();
				var ic_product_obj = self.get('product_stock_qtys');
				if (ic_order.length) {
					for (var i in ic_product_obj)
						ic_p_qty[i] = self.get('product_stock_qtys')[i];
					for (var i = 0; i < ic_order.length; i++) {
						if (!ic_order.models[i].is_return_order) {
							var i_order_line = ic_order.models[i]
								.get_orderlines();
							for (var j = 0; j < i_order_line.length; j++) {
								if (!i_order_line[j].stock_location_id)
									ic_p_qty[i_order_line[j].product.id] = ic_p_qty[i_order_line[j].product.id] -
									i_order_line[j].quantity;
								var qty = ic_p_qty[i_order_line[j].product.id];

								if (qty > self.config.deny_order) {
									$("#qty-tag-" + i_order_line[j].product.id).html(qty);
									$("#qty-tag-" + i_order_line[j].product.id).removeClass("not-available");
								} else {
									$("#qty-tag-" + i_order_line[j].product.id).html(qty);
									$("#qty-tag-" + i_order_line[j].product.id).addClass("not-available");
								} //end of else
							}
						}
					}
				}
			},
			i_remove_qty_css: function(product_id, qty) {
				self = this;
				var ic_p_qty = new Array();
				var ic_product_obj = self.get('product_stock_qtys');
				if (qty === "remove") {
					for (var i in ic_product_obj)
						ic_p_qty[i] = self.get('product_stock_qtys')[i];
					var qty = ic_p_qty[product_id];
					if (qty > self.config.deny_order) {
						$("#qty-tag-" + product_id).html(qty);
						$("#qty-tag-" + product_id).removeClass("not-available");
					} else {
						$("#qty-tag-" + product_id).html(qty);
						$("#qty-tag-" + product_id).addClass("not-available");
					} //end of else

				}
			}
		});
	var _super_order = models.Order.prototype;
	models.Order = models.Order
		.extend({
			add_product: function(product, options) {

				var self = this;
				options = options || {};
				for (var i = 0; i < this.orderlines.length; i++) {
					if (self.orderlines.at(i).product.id == product.id &&
						self.orderlines.at(i).stock_location_id) {
						options.merge = false;
					}
				}
				
				if (!self.pos.config.allow_order &&
					self.pos.config.display_stock_in_pos &&
					!self.pos.get_order().is_return_order) {

					var qty_count = 0;
					// if for 0 qty else for > 0 qty
					if (parseInt($("#qty-tag-" + product.id)
							.html())) {
						qty_count = parseInt($(
								"#qty-tag-" + product.id)
							.html())
					} else {
						var ic_order = self.pos
							.get('orders');
						var ic_p_qty = new Array();
						var qty;
						var ic_product_obj = self.pos
							.get('product_stock_qtys');
						if (ic_order) {
							for (var i in ic_product_obj)
								ic_p_qty[i] = self.pos
								.get('product_stock_qtys')[i];
							_.each(
								ic_order.models,
								function(order) {
									var orderline = order.orderlines.models
									if (orderline.length > 0)
										_.each(
											orderline,
											function(
												line) {
												if (!line.stock_location_id &&
													product.id == line.product.id)
													ic_p_qty[line.product.id] = ic_p_qty[line.product.id] -
													line.quantity;
											})
								})
							qty = ic_p_qty[product.id];
						}
						qty_count = qty
					}
					var allowed = self.pos.config.deny_order;
					if (self.pos.config.select_location_type == 'all') {
						if (product.qty_available > self.pos.config.deny_order) {
							allowed = product.qty_available - self.pos.config.deny_order;

						} else {
							allowed = 0;
						}
					} else {
						rpc.query({
							model: 'product.product',
							method: 'get_allowed_product_qty',
							args: [product.id, product.id, self.pos.config.id]
						}).then(function(result) {
							product.qty_available = result[1];
						});
						if (product.qty_available > self.pos.config.deny_order) {
							allowed = product.qty_available - self.pos.config.deny_order;

						} else {
							allowed = 0;
						}
					} //end else select_location_type
					if (product.type == "product" && qty_count <= self.pos.config.deny_order){
					    if (product.qty_available == 0){
						Gui.showPopup('OutOfStockPopupMessage', {
							title: _t('Alerta Super Barato'),
							body: _t("(" +
								product.display_name +
								")" +
								this.pos.config.custom_msg +
								"." ),
							'product_id': product.id
						});
					    }else{
						Gui.showPopup('OutOfStockPopupMessage', {
							title: _t('Alerta Super Barato'),
							body: _t("(" +
								product.display_name +
								")" +
								this.pos.config.custom_msg +
								"." + " Orden permitida para " + " " + allowed + " " + product.uom_id[1]),
							'product_id': product.id
						});
					    }
					}
					else{
						SuperOrder.add_product.call(this,
							product, options);
					}
				} else
					SuperOrder.add_product.call(this,
						product, options);
				if (self.pos.config.display_stock_in_pos &&
					!self.is_return_order)
					this.pos.i_change_qty_css();
			},
		});

	models.Orderline = models.Orderline
		.extend({
			template: 'Orderline',
			initialize: function(attr, options) {
				this.option = options;
				this.ic_line_stock_qty = 0.0
				if (options.product)
					this.ic_line_stock_qty = parseInt($(
							"#qty-tag-" + options.product.id)
						.html());
				SuperOrderline.initialize.call(this, attr,
					options);
			},
			
			
			apply_ms_data: function(data) {
				if (SuperOrderline.apply_ms_data) {
					SuperOrderline.apply_ms_data.apply(this, arguments);
				}
				var product = this.pos.db.get_product_by_id(data.product_id);
				if (product.qty_available !== data.qty_available) {
					this.pos.set_product_qty_available(product, data.qty_available);
				}
			},

			set_quantity: function(quantity, keep_price) {
				var self = this;
				if (self.stock_location_id && quantity &&
					quantity != 'remove') {
					if (self.product.type == "product" && self.pos.get_order() &&
						self.pos.get_order().selected_orderline &&
						self.pos.get_order().selected_orderline.cid == self.cid) {
						Gui.showPopup('OutOfStockPopupMessage', {
							'title': _t("Alerta Super Barato"),
							'body': _t("un producto tiene una ubicacion diferente"),
							'product_id': self.product.id
						});
						this.trigger('change', this);
						return;
					} else {
						SuperOrderline.set_quantity.call(
							this, quantity, keep_price);
						return;
					}
				} // end of if
				var qty = parseFloat(this.ic_line_stock_qty) - parseFloat(quantity)
				var allowed = self.pos.config.deny_order;
				if (self.pos.config.select_location_type == 'all') {
					if (self.product.qty_available > self.pos.config.deny_order) {
						allowed = self.product.qty_available - self.pos.config.deny_order;

					} else {
						allowed = 0;
					}
				} else {
					rpc.query({
						model: 'product.product',
						method: 'get_allowed_product_qty',
						args: [self.product.id, self.product.id, self.pos.config.id]
					}).then(function(result) {
					    self.product.qty_available = result[1];
					});
					if (self.product.qty_available > self.pos.config.deny_order) {
						allowed = self.product.qty_available - self.pos.config.deny_order;

					} else {
						allowed = 0;
					}
				} //end else select_location_type
				if ((!this.pos.config.allow_order && self.product.type == "product" &&
						this.pos.config.display_stock_in_pos &&
						isNaN(quantity) != true &&
						quantity != '' &&
						parseFloat(this.ic_line_stock_qty) -
						parseFloat(quantity) < self.pos.config.deny_order && this.ic_line_stock_qty != 0.0
					)) {
        				    if (self.product.qty_available == 0){
        					Gui.showPopup('OutOfStockPopupMessage', {
        						title: _t('Alerta Super Barato'),
        						body: _t("(" +
        							self.product.display_name +
        							")" +
        							this.pos.config.custom_msg +
        							"." ),
        						'product_id': self.product.id
        					});
        				    }else{
        					Gui.showPopup('OutOfStockPopupMessage', {
        						title: _t('Alerta Super Barato'),
        						body: _t("(" +
        							self.product.display_name +
        							")" +
        							this.pos.config.custom_msg +
        							"." + " Orden permitida para " + " " + allowed + " " + self.product.uom_id[1]),
        						'product_id': self.product.id
        					});
        				    }
					this.trigger('change', this);


				} //end of if
				else {
					var ic_avail_pro = 0;
					if (self.pos.get('selectedOrder')) {
						var ic_pro_order_line = (self.pos
								.get('selectedOrder'))
							.get_selected_orderline();
						if (!self.pos.config.allow_order &&
							self.pos.config.display_stock_in_pos &&
							ic_pro_order_line) {
							var ic_current_qty = parseInt($(
									"#qty-tag-" +
									(ic_pro_order_line.product.id))
								.html());
							if (quantity == '' ||
								quantity == 'remove')
								ic_avail_pro = ic_current_qty +
								ic_pro_order_line;
							else
								ic_avail_pro = ic_current_qty +
								ic_pro_order_line -
								quantity;
							var allowed = self.pos.config.deny_order;
							if (self.pos.config.select_location_type == 'all') {
								if (self.product.qty_available > self.pos.config.deny_order) {
									allowed = self.product.qty_available - self.pos.config.deny_order;

								} else {
									allowed = 0;
								}
							} else {
								rpc.query({
									model: 'product.product',
									method: 'get_allowed_product_qty',
									args: [self.product.id, self.product.id, self.pos.config.id]
								}).then(function(result) {
								    self.product.qty_available = result[1];
								});
								if (self.product.qty_available > self.pos.config.deny_order) {
									allowed = self.product.qty_available - self.pos.config.deny_order;

								} else {
									allowed = 0;
								}
							} //end else select_location_type
							if (ic_avail_pro < self.pos.config.deny_order && self.product.type == "product" &&
								(!(quantity == '' || quantity == 'remove'))) {
							    if (self.product.qty_available == 0){
		        					Gui.showPopup('OutOfStockPopupMessage', {
		        						title: _t('Alerta Super Barato'),
		        						body: _t("(" +
		        							self.product.display_name +
		        							")" +
		        							this.pos.config.custom_msg +
		        							"." ),
		        						'product_id': self.product.id
		        					});
		        				    }else{
		        					Gui.showPopup('OutOfStockPopupMessage', {
		        						title: _t('Alerta Super Barato'),
		        						body: _t("(" +
		        							self.product.display_name +
		        							")" +
		        							this.pos.config.custom_msg +
		        							"." + " Orden permitida para " + " " + allowed + " " + self.product.uom_id[1]),
		        						'product_id': self.product.id
		        					});
		        				    }
							} else
								SuperOrderline.set_quantity
								.call(this,
									quantity,
									keep_price);
						} else
							SuperOrderline.set_quantity
							.call(this, quantity,
								keep_price);
					} else
						SuperOrderline.set_quantity.call(
							this, quantity, keep_price);
					if (self.pos.config.display_stock_in_pos)
						self.pos
						.i_change_qty_css();
					if (quantity == "remove") {
						self.pos
							.i_remove_qty_css(self.product.id, "remove");
					}

				}
			}, //set_quantity method
		}); //end of models.Orderline
	
	models.Product = models.Product.extend({
		format_float_value: function(val) {
			var value = parseFloat(val);
			value = field_utils.format.float(value, {
				digits: [69, 3]
			});
			return String(parseFloat(value));
		},
		rounded_qty: function() {
			return this.format_float_value(this.qty_available);
		},
	});
});