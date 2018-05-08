$(document).ready(function () {
    GetChartDataDownloaded();
    GetChartDataPopularity();
});

var chartDataDownloaded = {};
var chartDataPopularity = {};

var GetChartDataDownloaded = function () {
    $.ajax({
        url: "/Statistics/GetDownloadedCategoryDistribution",
        method: 'GET',
        dataType: 'json',
        success: function (d) {
            chartDataDownloaded = {
                datasets: [{
                    data: d.datasets,
                    backgroundColor: ["#3e95cd", "#8e5ea2", "#3cba9f", "#e8c3b9", "#c45850"]
                }],
                labels: d.labels
            };
            respondDownloadedChart();
        }
    });
};
var GetChartDataPopularity = function () {
    $.ajax({
        url: "/Statistics/GetPopularityCategoryDistribution",
        method: 'GET',
        dataType: 'json',
        success: function (d) {
            chartDataPopularity = {
                datasets: [{
                    data: d.datasets,
                    backgroundColor: ["#3e95cd", "#8e5ea2", "#3cba9f", "#e8c3b9", "#c45850"]
                }],
                labels: d.labels
            };
            respondPopularityChart();
        }
    });
};


function respondDownloadedChart() {
    var c = $('#pieNrChart');
    drawCanvas(c, chartDataDownloaded, 'Distributia Categoriilor (Numar torrente)');
}
function respondPopularityChart() {
    var c = $('#piePeersChart');
    drawCanvas(c, chartDataPopularity, 'Popularitate torrente (Numar Peers)');
}

function drawCanvas(c, chartData,display) {
    var ctx = c.get(0).getContext("2d");
    var container = c.parent();

    var $container = $(container);

    c.attr('width', $container.width()); //max width
    c.attr('height', $container.height()); //max height                   

    //Call a function to redraw other content (texts, images etc)
    var chart = new Chart(ctx, {
        type: 'pie',
        data: chartData,
        options: {
            title: {
                display: true,
                text: display
            },
            animation: {
                duration: 500,
                easing: "easeOutQuart",
                onComplete: function () {
                    var ctx = this.chart.ctx;
                    ctx.font = Chart.helpers.fontString(Chart.defaults.global.defaultFontFamily, 'normal', Chart.defaults.global.defaultFontFamily);
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'bottom';

                    this.data.datasets.forEach(function (dataset) {

                        for (var i = 0; i < dataset.data.length; i++) {
                            var model = dataset._meta[Object.keys(dataset._meta)[0]].data[i]._model,
                                mid_radius = model.innerRadius + (model.outerRadius - model.innerRadius) / 2,
                                start_angle = model.startAngle,
                                end_angle = model.endAngle,
                                mid_angle = start_angle + (end_angle - start_angle) / 2;

                            var x = mid_radius * Math.cos(mid_angle);
                            var y = mid_radius * Math.sin(mid_angle);

                            ctx.fillStyle = '#fff';
                            if (i == 3) { // Darker text color for lighter background
                                ctx.fillStyle = '#444';
                            }

                            ctx.fillText(dataset.data[i], model.x + x, model.y + y);
                        }
                    });
                }
            }
        }
    });
}
