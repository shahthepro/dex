<template>
  <v-layout fill-height>
    <div id="dashboard" style='width: 100%; height: 100%;'>
        <div id="chart" style='width: 100%; height: calc(100% - 50px);'></div>
        <div id="control" style='width: 100%; height: 50px;'></div>
    </div>
  </v-layout>
</template>

<script>
export default {
  name: 'PriceChart',
  data () {
    return {
    }
  },
  created () {
    google.charts.load('current', { packages: ['corechart', 'controls'] });

    function drawVisualization() {
      var dashboard = new google.visualization.Dashboard(
          document.getElementById('dashboard'));

      var control = new google.visualization.ControlWrapper({
        'controlType': 'ChartRangeFilter',
        'containerId': 'control',
        'options': {
          // Filter by the date axis.
          'filterColumnIndex': 0,
          'ui': {
            'chartType': 'LineChart',
            'chartOptions': {
              'chartArea': {'width': '90%'},
                'hAxis': {'baselineColor': 'none', format: "dd.MM.yyyy",textStyle: { color: '#fff' }  },


              backgroundColor: {
                fill: '#424242',
                fillOpacity: 1
              },
            },
            // Display a single series that shows the closing value of the stock.
            // Thus, this view has two columns: the date (axis) and the stock value (line series).
            'chartView': {
              'columns': [0, 5]
            },
            // 1 day in milliseconds = 24 * 60 * 60 * 1000 = 86,400,000
            'minRangeSize': 86400000
          },
        },
        // Initial range: 2012-02-09 to 2012-03-20.
        'state': {'range': {'start': new Date(2012, 1, 9), 'end': new Date(2012, 2, 20)}}
      });

      var chart = new google.visualization.ChartWrapper({
        'chartType': 'CandlestickChart',
        'containerId': 'chart',
        'options': {
          // Use the same chart area width as the control for axis alignment.
          'chartArea': {'height': '80%', 'width': '90%'},
          'hAxis': {'slantedText': false,
          textStyle: { color: '#fff' } },
          'vAxis': {'viewWindow': {'min': 0, 'max': 2000}},
          'legend': {'position': 'none'},
          backgroundColor: {
            fill: '#424242',
            fillOpacity: 1
          },
          candlestick: {
            fallingColor: { strokeWidth: 0, fill: '#a52714' }, // red
            risingColor: { strokeWidth: 0, fill: '#0f9d58' }   // green
          }
        },
        // Convert the first column from 'date' to 'string'.
        'view': {
          'columns': [
            {
              'calc': function(dataTable, rowIndex) {
                return dataTable.getFormattedValue(rowIndex, 0);
              },
              'type': 'string'
            }, 1, 2, 3, 4]
        }
      });

      var data = new google.visualization.DataTable();
      data.addColumn('date', 'Date');
      data.addColumn('number', 'Stock low');
      data.addColumn('number', 'Stock open');
      data.addColumn('number', 'Stock close');
      data.addColumn('number', 'Stock high');
      data.addColumn('number', 'Stock volume');
      
      // Create random stock values, just like it works in reality.
      var open, close = 300;
      var low, high, volume;
      for (var day = 1; day < 121; ++day) {
        var change = (Math.sin(day / 2.5 + Math.PI) + Math.sin(day / 3) - Math.cos(day * 0.7)) * 150;
        change = change >= 0 ? change + 10 : change - 10;
        open = close;
        close = Math.max(50, open + change);
        low = Math.min(open, close) - (Math.cos(day * 1.7) + 1) * 15;
        low = Math.max(0, low);
        high = Math.max(open, close) + (Math.cos(day * 1.3) + 1) * 15;
        var date = new Date(2012, 0 ,day);
        volume = high * (Math.random() * 1000000);
        data.addRow([date, Math.round(low), Math.round(open), Math.round(close), Math.round(high), Math.round(volume)]);
      }

      /* Change the format of the date column, used in chart, but not chart range filter */  
      var formatter = new google.visualization.DateFormat({pattern: "dd.MM.yyyy"});
      formatter.format(data, 0);

      
      dashboard.bind(control, chart);
      dashboard.draw(data);
    }

    google.charts.setOnLoadCallback(drawVisualization);


  },
}
</script>

<style lang="scss" scoped>

</style>
