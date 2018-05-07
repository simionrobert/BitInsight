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
        url: "/Statistics/GetDownloadedCategoryDistribution",
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
    drawCanvas(c, chartDataPopularity, 'Popularitate torrente (Numar torrente)');
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
            }
        }
    });
}
