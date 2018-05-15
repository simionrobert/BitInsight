//// Write your JavaScript code.

function initMap() {
    var uluru = { lat: parseFloat($("#lat").text()), lng: parseFloat($("#lon").text()) };

    var map = new google.maps.Map(document.getElementById('map'), {
        zoom: 4,
        center: uluru
    });
    var marker = new google.maps.Marker({
        position: uluru,
        map: map
    });
}

$(document).ready(function () {

    $("#jsGrid").jsGrid({
        width: "100%",

        autoload: true,
        selecting: false,
        sorting: true,
        paging: true,
        pageSize: 15,
        pageLoading: true,
        pageIndex: 1,


        controller: {
            loadData: function (filter) {

                var url = window.location.search;
                url = url.replace("?q=", '');

                var data = $.Deferred();
                $.ajax({
                    type: "GET",
                    contentType: "application/json",
                    url: "/Search/SearchJSON?q=" + url,
                    data: filter
                }).done(function (response) {
                    data.resolve(response);
                });

                return data.promise();
            }
        },

        fields: [
            { name: "type", title: "Type", width: 15 },
            {
                name: "name", title: "Name",
                itemTemplate: function (value, item) {
                    var $title = $("<a>").attr("href", "/Detail/Index/" + item.id).text(value);

                    //subtitle
                    var $icon = $("<span>").attr("class", "glyphicon glyphicon-magnet");
                    var $subText = $("<a>").attr("href", item.magnetLink).addClass("noborder").append($icon).append(" ");

                    var $subtitle = $("<p>").addClass("subtitle").append($subText).append($("<small>").append(item.categories));


                    return $("<div>").append($title).append($subtitle);
                }
            },
            { name: "date", title: "Added", type: "date", width: 30 },
            { name: "size", title: "Size", type: "text", width: 25 },
            { name: "peerNumber", title: "Peers", type: "number", width: 10 }
        ]
    });

});
