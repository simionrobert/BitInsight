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
});