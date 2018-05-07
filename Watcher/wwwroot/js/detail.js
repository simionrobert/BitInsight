$(document).ready(function () {


    var fileDOM = document.getElementById("infoFiles");
    var countDOM = document.getElementById("infoCount");
    var fileDOMInfo = fileDOM.innerHTML;
    var countDOMInfo = countDOM.innerHTML;
    var acc = document.getElementsByClassName("accordion");

    fileDOM.hidden = true;

    acc[0].addEventListener("click", function () {
        this.classList.toggle("active");
        if (countDOM.innerHTML == countDOMInfo) {
            countDOM.innerHTML = fileDOMInfo;
        } else {
            countDOM.innerHTML = countDOMInfo;
        }
    });


    // ips

    var ipDOM = document.getElementById("infoIPs");
    var acc2 = document.getElementById("accordion2");

    ipDOM.hidden = true;

    acc2.addEventListener("click", function () {
        this.classList.toggle("active");
        if (ipDOM.hidden == true) {
            ipDOM.hidden = false;
        } else {
            ipDOM.hidden = true;
        }
    });

    var $rows = $('#infoIPs tbody tr');
    $('#searchIP').keyup(function () {
        var val = $.trim($(this).val()).replace(/ +/g, '').toLowerCase();

        $rows.show().filter(function () {
            var text = $(this).text().replace(/\s+/g, '').toLowerCase();
            return !text.startsWith(val);
        }).hide();
    });
});