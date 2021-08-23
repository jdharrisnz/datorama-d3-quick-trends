var quickTrends = {
	'initialize': function() {
		// Store the query result
			var queryResult = DA.query.getQueryResult();

		// Ensure the query meets the conditions
			var query = DA.query.getQuery();
			if (Object.keys(query.fields).length === 0) {
				d3.select('#__da-app-content').append('h1').text('Just add data!');
				d3.select('#__da-app-content').append('p').text('Add data in your widget settings to start making magic happen.');
				javascriptAbort();  // Garbage meaningless function to get the widget to stop processing
			}
			else if (Object.keys(query.fields.dimension).filter(x => x.startsWith('DATE_')).length === 0 || // If a date field isn't queried
							 Object.keys(query.fields.dimension).length != 1 || // Or if the date field isn't the only dimension
							 Object.keys(query.fields.metric).length === 0 || // Or if no metrics are selected
							 queryResult.rows.length <= 1 ) { // Or if there's not enough data
				// d3.select('#__da-app-content')
				// .html('<h1>Requirements not met.</h1><p>Make sure your query includes<ul><li>one calendar date dimension;</li><li>some metrics; and</li><li>more than one row of data.</li></ul>Remember to set the positive/negative settings in the widget design panel.</p>');
				d3.select('#__da-app-content').append('h1').text('Requirements not met.');
				var p = d3.select('#__da-app-content').append('p');
				p.append('span').text('Make sure your query includes');
				var ul = p.append('ul');
				ul.append('li').text('one calendar dimension;');
				ul.append('li').text('some metrics; and');
				ul.append('li').text('more than one row of data.');
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

			// Identify the fields and add some metadata
				var metrics = [];
				queryResult.fields.forEach((field, i) => {
					if (field.type == 'metric') {
						field.colIndex = i;
						var lastRows = queryResult.rows.slice(queryResult.rows.length - 2, queryResult.rows.length);
						field.rose = lastRows[0][i].value == lastRows[1][i].value ? null : lastRows[0][i].value < lastRows[1][i].value;
						if (settings[field.systemName] == 'positive') {
							field.positive = field.rose;
						}
						else if (settings[field.systemName] == 'negative') {
							field.positive = !field.rose;
						}
						else if (settings[field.systemName] == 'neutral') {
							field.positive = null;
						}
						metrics.push(field);
					}
				});

				var dateName = queryResult.fields.filter(x => x.systemName.startsWith('DATE_'))[0].systemName.split('_')[1].toLowerCase();

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
								.text(d => queryResult.totals[0].data[0][d.colIndex - 1]);

						// Create the line charts
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
			});
	}
};