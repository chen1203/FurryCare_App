/********** LOGIN **********/

$("#loginButton").change(function(){
    console.log("jsahdjfs change");
    readURL(this);
});

$("#loginSectionButton").click(function () {
    console.log("dsjfhsjdfh");
    $("#loginButton").trigger('click');
});

$( document ).ready(function() {
  // Handler for .ready() called.
//  console.log("on ready");
});

/********** NEW ANIMAL **********/

function readURL(input) {
    if (input.files && input.files[0]) {
        var reader = new FileReader();
        reader.onload = function (e) {
            $('#profileImage').attr('src', e.target.result);
        }
        reader.readAsDataURL(input.files[0]);
    }
}
$("#imgInp").change(function(){
    readURL(this);
});

$("#profileImage").click(function () {
    $("#imgInp").trigger('click');
});