$(document).ready(function () {
    window.chartColors = {
        red: 'rgb(255, 99, 132)',
        orange: 'rgb(255, 159, 64)',
        yellow: 'rgb(255, 205, 86)',
        green: 'rgb(75, 192, 192)',
        blue: 'rgb(54, 162, 235)',
        purple: 'rgb(153, 102, 255)',
        grey: 'rgb(201, 203, 207)'
    };

    var chartDataDownloaded = {};
    var chartDataPopularity = {};
    var chartDataIP = {};

    GetChartDataDownloaded();
    GetChartDataPopularity();
    GetChartDataIP();
});

function GetChartDataIP() {
    $.ajax({
        url: "/Statistics/GetIPTorrentDistribution",
        method: 'GET',
        dataType: 'json',
        success: function (d) {
            chartDataIP = {
                datasets: [{
                    data: d.datasets,
                    label: 'Nr. Torrente',
                    backgroundColor: window.chartColors.red,
                    borderColor: window.chartColors.red,
                    fill: false,
                    pointRadius: 2,
                    pointHoverRadius: 10,
                    showLine: false // no line shown
                }],
                labels: d.labels
            };
            respondIPTorrentChart();
        }
    });
};
function GetChartDataDownloaded() {
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
function GetChartDataPopularity() {
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
function respondIPTorrentChart() {
    var c = $('#lineChartIP');
    drawLine(c, chartDataIP, 'Distributia IP/torrente');
}

function drawLine(c, chartData, display) {
    var ctx = c.get(0).getContext("2d");
    var container = c.parent();
    var $container = $(container);
    c.attr('width', $container.width()); //max width

    new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: {
            responsive: true,
            title: {
                display: true,
                text: display
            },
            legend: {
                display: false
            },
            elements: {
                point: {
                    pointStyle: 'star'
                }
            },
            scales: {
                xAxes: [{
                    display: true,
                    scaleLabel: {
                        display: true,
                        labelString: 'IP-uri'
                    },
                    ticks: {
                        autoSkip: true,
                        maxTicksLimit: 0
                    }
                }],
                yAxes: [{
                    display: true,
                    scaleLabel: {
                        display: true,
                        labelString: 'Torrente'
                    }
                }]
            },
        }

    });
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
