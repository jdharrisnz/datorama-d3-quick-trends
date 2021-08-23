# datorama-d3-quick-trends
Custom widget for Datorama. Visualises trends for metrics broken down by a date.

This custom widget creates separate boxes for each metric added to the data query, and compares the last two data points to create a judgment ('rose', or 'dropped').

![Preview image](image.png)

## Set up and Dependencies
Add `quickTrends.initialize();` to the JS section of the Custom Widget Editor, and add the below dependencies to the second tab.

Script dependencies (must be loaded in this order):
1. `https://d3js.org/d3.v7.min.js`
2. `https://solutions.datorama-res.com/public_storage_solutions/quickTrends/v1/quickTrends.js`

Style dependency:
1. `https://solutions.datorama-res.com/public_storage_solutions/quickTrends/v1/quickTrends.css`

## Preferences
All preferences are located in the design tab of the widget options. These include light or dark mode, and positive/neutral/negative settings for each measurement.