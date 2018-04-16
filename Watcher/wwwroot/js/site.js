//// Write your JavaScript code.
//$(document).ready(function () {

//    $("#jsGrids").jsGrid({
//        width: "100%",
//        height: "750px",

//        autoload: true,
//        selecting: true,
//        sorting: true,
//        paging: true,
//        pageSize: 15,
//        pageLoading: true,
//        pageIndex: 1,

//        controller: {
//            loadData: function (filter) {
//                //var startIndex = (filter.pageIndex - 1) * filter.pageSize;
//                //var endIndex = startIndex + filter.pageSize;

//                var data = $.Deferred();
//                $.ajax({
//                    type: "GET",
//                    contentType: "application/json",
//                    url: "/Search/Index",
//                    data: filter
//                }).done(function (response) {
//                    data.resolve(response);
//                });

//                return data.promise();

//                //return {
//                //    data: db.clients.slice(startIndex, endIndex),
//                //    itemsCount: db.clients.length
//                //};
//            }
//        },

//        fields: [
//            { name: "Category", type: "text" },
//            { name: "Name", type: "text" },
//            { name: "Added", type: "text" },
//            { name: "Size", type: "text" },
//            { name: "Peers", type: "number" }
//        ]
//    });
//});
    