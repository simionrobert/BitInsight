$('#myModal').modal('hide')   

$(document).ready(function () {
 
    $(".openDialog").on("click", function () {
        $.ajax({
            type: "GET",
            contentType: "application/json",
            url: "/Statistics/GetTopCities?q=" + $(this).text(),
        }).done(function (response) {
            var data = eval(response);

            var table = document.getElementById("cityTable")
            for (var i = table.rows.length - 1; i > 0; i--) {
                table.deleteRow(i);
            }

            var i = 1;
            for (var key in data) {
                if (data.hasOwnProperty(key)) { 
                    var newRow = table.insertRow(table.length);

                    newRow.insertCell(0).innerHTML = i;
                    newRow.insertCell(1).innerHTML = key;
                    newRow.insertCell(2).innerHTML = data[key];

                    i++;
                }
            }

            $('#dialog-modal').modal('show'); 
        });
    });
});