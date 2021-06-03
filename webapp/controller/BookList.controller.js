sap.ui.define(
	[
		'sap/ui/core/mvc/Controller',
		'sap/ui/model/Filter',
		'sap/ui/model/FilterOperator',
		'../model/formatter',
		'sap/m/MessageToast'
	],
	(Controller, Filter, FilterOperator, formatter, MessageToast) => {
		'use strict'

		return Controller.extend('library.controller.BookList', {
			formatter,
			onReset() {},

			onSearch(oEvent) {
				const aSelectionSet = oEvent.getParameter('selectionSet')
				const aFilters = aSelectionSet.reduce((aResult, oControl) => {
					if (oControl.getValue()) {
						if (oControl.getName() === 'DatePublished') {
							aResult.push(
								new Filter(
									oControl.getName(),
									FilterOperator.EQ,
									oControl.getDateValue()
								)
							)
						} else {
							aResult.push(
								new Filter(
									oControl.getName(),
									FilterOperator.Contains,
									oControl.getValue()
								)
							)
						}
					}

					return aResult
				}, [])

				if (aFilters.length > 0) {
					this.byId('idBooksTable')
						.getBinding('rows')
						.filter(
							new Filter({
								filters: aFilters,
								and: true
							})
						)
				} else {
					this.byId('idBooksTable').getBinding('rows').filter()
				}
			},
			queue: [],
			doTheQueue() {
				const current = this.queue.pop()

				// Queue empty, refresh to get correct #Available data
				if (!current) {
					this.byId('idBooksTable').getBinding('rows').refresh()
					return
				}

				// No more available books
				if (
					Number(
						this.byId('idBooksTable').getRows()[current].mAggregations.cells[5]
							.mProperties.text
					) <= 0
				) {
					MessageToast.show('Not available')
					this.doTheQueue()
					return
				}

				this.getView()
					.getModel()
					.create(
						'/CheckedOutSet',
						{
							BooksId: String(
								this.byId('idBooksTable').getRows()[current].mAggregations.cells[1]
									.mProperties.text
							)
						},
						{
							success: () => {
								MessageToast.show('ok')
								// this.doTheQueue() should be here
							},
							error: e => {
								console.log(e)

								// should be in success
								MessageToast.show('Checked Out')
								this.doTheQueue()
							}
						}
					)
			},
			onCheckout() {
				this.byId('idBooksTable')
					.getSelectedIndices()
					.forEach(index => this.queue.push(index))

				this.byId('idBooksTable').clearSelection()

				this.doTheQueue()
			}
		})
	}
)
