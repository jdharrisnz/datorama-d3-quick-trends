var quickTrends = {
	'initialize': function() {
		// Store the query result
			var queryResult = DA.query.getQueryResult();

		// Ensure the query meets the conditions
			var query = DA.query.getQuery();
			if (queryResult.rows.length === 0) { // If query has no data
				var container = d3.select('#__da-app-content').append('div')
					.style('color', 'rgba(0,1,2,0.49)')
					.style('width', '100%')
					.style('height', '100%')
					.style('display', 'flex')
					.style('flex-direction', 'column')
					.style('justify-content', 'center')
					.style('align-items', 'center');
				container.append('svg')
					.attr('width', '56px')
					.attr('height', '56px')
					.style('margin-bottom', '20px')
					.attr('viewBox', '0 0 20 20')
					.attr('preserveAspectRatio', 'xMidYMid meet')
					.attr('fill', 'rgba(0,1,2,0.2')
					.append('path')
						.attr('d', 'M19 18.33 14.4 13.7a7.68 7.68 0 1 0-.71.71L18.33 19A.5.5 0 0 0 19 18.33Zm-10.38-3a6.66 6.66 0 1 1 6.66-6.66A6.66 6.66 0 0 1 8.66 15.31Z');
				container.append('div')
					.style('font-size', '14px')
					.style('margin-bottom', '3px')
					.text('No Data Available');
				container.append('div')
					.style('font-size', '12px')
					.text('Check data or applied filters');
				javascriptAbort();  // Garbage meaningless function to get the widget to stop processing
			}
			else if (Object.keys(query.fields).length === 0) {
				d3.select('#__da-app-content').append('h1').text('Just add data!');
				d3.select('#__da-app-content').append('p').text('Add data in your widget settings to start making magic happen.');
				javascriptAbort();  // Garbage meaningless function to get the widget to stop processing
			}
			else if (Object.keys(query.fields.dimension).filter(x => x.startsWith('DATE_')).length === 0 || // If a date field isn't queried
							 Object.keys(query.fields.dimension).length != 1 || // Or if the date field isn't the only dimension
							 Object.keys(query.fields.metric).length === 0) { // Or if no metrics are selected
				d3.select('#__da-app-content').append('h1').text('Requirements not met.');
				var p = d3.select('#__da-app-content').append('p');
				p.append('span').text('Make sure your query includes');
				var ul = p.append('ul');
				ul.append('li').text('one calendar date dimension; and');
				ul.append('li').text('some metrics.');
				p.append('span').text('Remember to set the positive/negative settings in the widget design panel.');
				javascriptAbort();  // Garbage meaningless function to get the widget to stop processing
			}

		// Wrapper function to get design settings
			function getDesignSettings() {
				return new Promise((resolve, reject) => {
					DA.widget.customDesignSettings.get( {cb: (err, params) => {
						resolve(params);
					}});
				});
			}

		// Set the design options
			var options = [
				{ 'type': 'select',
					'id': 'lightDark',
					'displayName': 'Light or Dark Mode',
					'options': [ { 'id': 'light', 'label': 'Light' }, { 'id': 'dark', 'label': 'Dark' }],
					'defaultValue': 'light' },
				{ 'type': 'separator' },
				{ 'type': 'title',
					'displayName': 'Metric Positivity' }
			];

			options = options.concat(
				queryResult.fields.filter(x => x.type == 'metric').map(field => {
					return {
						'type': 'select',
						'id': field.systemName,
						'displayName': field.name,
						'options': [{ 'id': 'positive', 'label': 'Higher is better' }, { 'id': 'negative', 'label': 'Lower is better' }, { 'id': 'neutral', 'label': 'Neutral' }],
						'defaultValue': 'positive'
					};
				})
			);

			DA.widget.customDesignSettings.set(options);

		// Get the design settings, then create the widget
			getDesignSettings().then(settings => {

			// Check the completeness of start and end periods
				var dateIndex = queryResult.fields.findIndex(x => x.systemName.startsWith('DATE_'));

				if (queryResult.rows.length > 1) {					
					var startIncomplete = queryResult.rows[0][dateIndex].value < query.date.startDate;
					var endIncomplete;
					var endDate = new Date(queryResult.rows[queryResult.rows.length - 1][dateIndex].value);
					switch(queryResult.fields[dateIndex].systemName) {
						case 'DATE_WEEK':
							endDate.setDate(endDate.getDate() + 7);
							break;
						case 'DATE_BI_WEEK':
							endDate.setDate(endDate.getDate() + 14);
							break;
						case 'DATE_MONTH':
							endDate.setDate(new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0).getDate())
							break;
						case 'DATE_QUARTER':
							endDate.setMonth(endDate.getMonth() + 3);
							endDate.setDate(0);
							break;
						case 'DATE_YEAR':
							endDate = new Date(endDate.getFullYear(), 11, 31)
							break;
					}
					endIncomplete = endDate.toISOString().slice(0, 10) > query.date.endDate;
					if (startIncomplete || endIncomplete) {
						var messages = d3.select('#__da-app-content').append('div').attr('id', 'messages');
						messages.append('svg')
							.attr('viewBox', '0 0 512 512')
							.attr('preserveAspectRatio', 'xMidYMid meet')
							.attr('fill', 'rgb(244, 206, 77)')
							.selectAll('path')
							.data([
								'M256 8C119 8 8 119.08 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm0 376a32 32 0 1 1 32-32 32 32 0 0 1-32 32zm38.24-238.41-12.8 128A16 16 0 0 1 265.52 288h-19a16 16 0 0 1-15.92-14.41l-12.8-128A16 16 0 0 1 233.68 128h44.64a16 16 0 0 1 15.92 17.59z',
								'M278.32 128h-44.64a16 16 0 0 0-15.92 17.59l12.8 128A16 16 0 0 0 246.48 288h19a16 16 0 0 0 15.92-14.41l12.8-128A16 16 0 0 0 278.32 128zM256 320a32 32 0 1 0 32 32 32 32 0 0 0-32-32z'
							])
							.join('path')
								.attr('opacity', (d, i) => i == 0 ? '0.4': null)
								.attr('d', d => d);
						messages.append('span')
							.html(() => {
								var text = startIncomplete && endIncomplete
										 ? '<b>first and last periods are'
										 : startIncomplete
										 ? '<b>first period is'
										 : endIncomplete
										 ? '<b>last period is'
										 : null;
								return 'The ' + text + ' incomplete</b> for this date filter, so the line and % change may be inaccurate for summable measurements (e.g., impressions, clicks).'
							});
					}
				}
				

			// Identify the fields and add some metadata
				var metrics = [];
				queryResult.fields.forEach((field, i) => {
					if (field.type == 'metric') {
						field.colIndex = i;
						var lastRows = queryResult.rows.slice(queryResult.rows.length - 2, queryResult.rows.length);
						field.rose = lastRows.length == 1 || lastRows[0][i].value == lastRows[1][i].value ? null : lastRows[0][i].value < lastRows[1][i].value;
						if (field.rose == null || settings[field.systemName] == 'neutral') {
							field.positive = null;
						}
						else if (settings[field.systemName] == 'positive') {
							field.positive = field.rose;
						}
						else if (settings[field.systemName] == 'negative') {
							field.positive = !field.rose;
						}
						metrics.push(field);
					}
				});

			// Create the document structure
				var container = d3.select('#__da-app-content').append('div').attr('id', 'container');
				var tooltip = d3.select('#__da-app-content').append('div').attr('id', 'tooltip').style('display', 'none');

			// Calculate required columns for tiles
				function calculateGrid() {
					var containerBox = container.node().getBoundingClientRect();
					var itemsPerRow = Math.floor(containerBox.width / 260);
					var rows = Math.ceil(metrics.length / itemsPerRow);
					var tilesPerRow = Math.ceil(metrics.length / rows);
					container.style('grid-template-columns', 'repeat(' + tilesPerRow + ', minmax(260px, 1fr)');
				}

				calculateGrid();
				window.addEventListener('resize', () => calculateGrid());

			// Create the boxes
				var boxes = container.selectAll('div')
				.data(metrics)
				.join('div')
					.attr('class', 'status-box')
					.style('background-color', settings.lightDark == 'light' ? 'rgb(254, 254, 254)' : 'rgb(60, 60, 60)');

				// Write the title arrows and text
					var titles = boxes.append('div')
						.attr('class', d => 'title' + (d.positive === true ? ' positive' : d.positive === false ? ' negative' : ''));

					titles.append('svg')
					.attr('class', 'arrow')
					.attr('viewBox', '0 0 320 512')
					.attr('preserveAspectRatio', 'xMidYMid meet')
					.append('path')
						.attr('transform', d => d.rose ? 'scale(1, 1)' : 'scale(1, -1)' )
						.attr('transform-origin', 'center center')
						.style('visibility', d => d.rose === null ? 'hidden' : null)
						.attr('d', 'M58.427 225.456L124 159.882V456c0 13.255 10.745 24 24 24h24c13.255 0 24-10.745 24-24V159.882l65.573 65.574c9.373 9.373 24.569 9.373 33.941 0l16.971-16.971c9.373-9.373 9.373-24.569 0-33.941L176.971 39.029c-9.373-9.373-24.568-9.373-33.941 0L7.515 174.544c-9.373 9.373-9.373 24.569 0 33.941l16.971 16.971c9.372 9.373 24.568 9.373 33.941 0z');

					titles.append('span')
						.attr('class', 'metric-name')
						.text(d => d.name);

					titles.append('span')
						.text(d => d.rose === null ? null : d.rose ? ' rose' : ' dropped');

				// Create the vis containers
					var visContainers = boxes.append('div')
						.attr('class', 'vis-container');

					// Create the trends
						var trendContainers = visContainers.append('div')
							.attr('class', 'trends-container');

						// Create the total
							trendContainers.append('div')
								.attr('class', 'trend-total')
								.style('font-size', queryResult.rows.length == 1 ? '24px' : null)
								.text(d => queryResult.totals[0].data[0][d.colIndex - 1]);

						// Create the line charts
							if (queryResult.rows.length > 1) {
								var lineCharts = trendContainers.append('svg')
									.attr('viewBox', d => {
										var min = d3.min(queryResult.rows, x => x[d.colIndex].value);
										var max = d3.max(queryResult.rows, x => x[d.colIndex].value);
										var range = max - min;
										return '0 0 1 ' + (range / max);
									})
									.attr('preserveAspectRatio', 'xMidYMid meet')
									.attr('class', 'line-chart');

								lineCharts.append('path')
									.attr('d', d => {
										var min = d3.min(queryResult.rows, x => x[d.colIndex].value);
										var max = d3.max(queryResult.rows, x => x[d.colIndex].value);
										return queryResult.rows.map((row, i) => {
											return [
												i === 0 ? 'M' : 'L',
												i / (queryResult.rows.length - 1),
												(row[d.colIndex].value - min) / max
											].join(' ');
										}).join(' ');
									});

								lineCharts.selectAll('circle')
								.data(d => {
									var min = d3.min(queryResult.rows, x => x[d.colIndex].value);
									var max = d3.max(queryResult.rows, x => x[d.colIndex].value);
									return queryResult.rows.map((row, i) => {
										return {
											'x': i / (queryResult.rows.length - 1),
											'y': (row[d.colIndex].value - min) / max,
											'formattedValue': row[d.colIndex].formattedValue
										};
									});
								})
								.join('circle')
									.attr('cx', d => d.x)
									.attr('cy', d => d.y)
									.attr('r', '0.02')
									.on('mouseenter', (event, d) => {
										var targetBox = d3.select(event.target).node().getBoundingClientRect();
										tooltip.style('display', null)
										.text(d.formattedValue)
										.style('left', targetBox.left + targetBox.width / 2 + 'px')
										.style('top', targetBox.top + 'px');
									})
									.on('mouseleave', () => tooltip.style('display', 'none'));

						// Create the date range explanation
								var dateName = queryResult.fields[dateIndex].systemName.split('_').slice(1).map(x => x.toLowerCase()).join(' ');

								trendContainers.append('div')
									.attr('class', 'last-x')
									.text('Last ' + queryResult.rows.length + ' ' + dateName + 's');

						// Write the text for the latest trend
								var latestTrends = visContainers.append('div')
									.attr('class', 'latest-trend');

								latestTrends.append('div')
									.attr('class', d => 'percent-change ' + (d.positive === true ? 'positive' : d.positive === false ? 'negative' : null))
									.text(d => {
										var lastRows = queryResult.rows.slice(queryResult.rows.length - 2, queryResult.rows.length);
										return d3.format(',.0%')((lastRows[1][d.colIndex].value - lastRows[0][d.colIndex].value) / lastRows[0][d.colIndex].value);
									});

								latestTrends.append('div')
									.attr('class', 'change-explanation')
									.html(d => (d.rose === null ? 'change' : d.rose ? 'rise' : 'drop') + ' for<br>latest ' + dateName);
							}
			});
	}
};