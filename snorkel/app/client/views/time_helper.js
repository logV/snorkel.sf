var _labels = {};
function time_prepare(data, options) {
  if (!options) {
    options = {};
  }

  var dataset = options.dataset;
  var is_compare = options.is_compare;

  // dependency injection
  var presenter = options.presenter;
  var helpers = options.helpers;


  var series = {};
  var divisor = 1;
  if (data.parsed.time_divisor === "min") {
    divisor = (data.parsed.time_bucket / 60);
  } else if (data.parsed.time_divisor === "hour") {
    divisor = (data.parsed.time_bucket / 3600);
  }

  // For each column, need to record a series
  var group_by = data.parsed.dims || [];
  group_by.sort();

  _.each(data.results, function(result) {
    _.each(result, function(value, field) {
      if (field === "_id") { return; }

      if (data.parsed.agg === "$count" || data.parsed.agg === "$distinct") {
        if (field !== "count") { return; }
      } else {
        if (field === "count") { return; }
        if (field === "weighted_count") {
          return;
        }
      }

      if (data.parsed.agg === "$count" || data.parsed.agg === "$sum") {
        value = value / divisor;
      }

      if (presenter) {
        var formatter = presenter.get_field_number_formatter(dataset, field);
        if (formatter) {
          value = formatter(value, value);
        }
      }



      var dims = _.map(group_by, function(g) {
        return result._id[g];
      });

      var group_label = dims.join(",");
      var field_label = group_label + " " + field;
      if (presenter) {
        field_label = group_label + " " + presenter.get_field_name(dataset, field);
      }

      var full_label = field_label;

      _labels[full_label] = group_label || full_label;

      if (!series[field_label]) {
        var color = "#000";
        if (helpers) {
          color = helpers.get_color(group_label || full_label);
        }

        series[field_label] = {
          data: [],
          name: full_label,
          color: color
        };
      }


      // denormalize the time bucket into ms for highcharts benefit
      var pt = {
        x: result._id.time_bucket * 1000,
        y: parseInt(value, 10),
        samples: result.count,
        compare: is_compare
      };

      if (pt.y !== null && !_.isNaN(pt.y)) {
        series[field_label].data.push(pt);
      }
    });
  });

  _.each(series, function(serie) {
    serie.data.sort(function(a, b) {
      return a.x - b.x;
    });
  });

  return series;
}


module.exports = {
  prepare: time_prepare,
  labels: _labels
};
