//// Write your JavaScript code.


$(document).ready(function () {
    var pathname = window.location.pathname;

    switch (pathname) {
        case "/Search": // From search input
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
                    { name: "type", title: "Type", width: 10},
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
                    {name: "date", title: "Added", type: "date",width: 20},
                    { name: "size", title: "Size", type: "text", width: 10 },
                    { name: "peerNumber", title: "Peers", type: "number", width: 5 }
                ]
            });
            break;
        case "/Search/Top":

            $("#jsGrid").jsGrid({
                width: "100%",

                autoload: true,
                selecting: false,
                pageLoading: true,

                controller: {
                    loadData: function (filter) {
                        var data = $.Deferred();
                        $.ajax({
                            type: "GET",
                            contentType: "application/json",
                            url: "/Search/TopJSON",
                            data: filter
                        }).done(function (response) {
                            data.resolve(response);
                        });

                        return data.promise();
                    }
                },

                fields: [
                    { name: "type", title: "Type", width: 30 },
                    {
                        name: "name", title: "Name",
                        itemTemplate: function (value, item) {
                            var $title = $("<a>").attr("href", "/Detail/Index/" + item.id).text(value);

                            var $icon = $("<span>").attr("class", "glyphicon glyphicon-magnet");
                            var $subText = $("<a>").attr("href", item.magnetLink).addClass("noborder").append($icon).append(" ");
                            var $subtitle = $("<p>").addClass("subtitle").append($subText).append($("<small>").append(item.categories));

                            return $("<div>").append($title).append($subtitle);
                        }
                    },
                    { name: "date", title: "Added", type: "date", width: 50 },
                    { name: "size", title: "Size", type: "text", width: 25 },
                    { name: "peerNumber", title: "Peers", type: "number", width: 10 }
                ]
            });
            break;
        case "/Search/Recent":

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
                        var data = $.Deferred();
                        $.ajax({
                            type: "GET",
                            contentType: "application/json",
                            url: "/Search/RecentJSON",
                            data: filter
                        }).done(function (response) {
                            data.resolve(response);
                        });

                        return data.promise();
                    }
                },

                fields: [
                    { name: "type", title: "Type", width: 30 },
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
                    { name: "date", title: "Added", type: "date", width: 50 },
                    { name: "size", title: "Size", type: "text", width: 25 },
                    { name: "peerNumber", title: "Peers", type: "number", width: 10 }
                ]
            });
            break;
    }
});
