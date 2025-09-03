var valid = {
  ajaxError: function (jqXHR, exception) {
    var msg = '';
    if (jqXHR.status === 0) {
      msg = 'Not connect.\n Verify Network.';
    } else if (jqXHR.status == 404) {
      msg = 'Requested page not found. [404]';
    } else if (jqXHR.status == 500) {
      msg = 'Internal Server Error [500].';
    } else if (exception === 'parsererror') {
      msg = 'Requested JSON parse failed.';
    } else if (exception === 'timeout') {
      msg = 'Time out error.';
    } else if (exception === 'abort') {
      msg = 'Ajax request aborted.';
    } else {
      msg = 'Uncaught Error.\n' + jqXHR.responseText;
    }
    return msg;
  },
  snackbar: function (msg) {
    $('#snackbar').html(msg).fadeIn('slow').delay(3000).fadeOut('slow');
  },
  snackbar_error: function (msg) {
    $('#snackbar-error').html(msg).fadeIn('slow').delay(3000).fadeOut('slow');
  },
  snackbar_success: function (msg) {
    $('#snackbar-success').html(msg).fadeIn('slow').delay(3000).fadeOut('slow');
  },
  error: function (msg) {
    return '<p class=\'alert alert-danger\'><strong>Error : </strong> ' + msg + '</p>';
  },
  success: function (msg) {
    return '<p class=\'alert alert-success\'>' + msg + '</p>';
  },
  info: function (msg) {
    return '<p class=\'alert alert-info\'>' + msg + '</p>';
  }
};
$(document).ready(function () {

  $('#loginform').validate({
    rules: {
      email: { required: true, },
      password: { required: true, },
    },
    messages: {
      email: { required: 'Please enter username', },
      password: { required: 'Please enter password', },
    },
    highlight: function (element, errorClass) {
      // Custom highlighting logic, add your styling here
      $(element).addClass('custom-error is-invalid');
    },
    unhighlight: function (element, errorClass) {
      // Custom unhighlighting logic, add your styling here
      $(element).removeClass('custom-error is-invalid');
    },    
    submitHandler: function (form) {
      $('#submitBtn').attr('disabled', true);
      $('#submitBtnText').text('Loading...');
      $('#btn_spinner').css('display', 'inline-block');
      $.ajax({
        url: `/login-user`,
        type: 'POST',
        data: new FormData(form),
        processData: false,
        contentType: false,
        dataType: 'json',
        success: function (data) {
          if (data.status == 'SUCCESS') {
            setTimeout(function () {
              window.location.href = '/swagger';
            }, 1000);
            $('#loginmsg').html(valid.success(data.message));
            $('#submitBtn').attr('disabled', false);
            $('#submitBtnText').text('Submit');
            $('#btn_spinner').css('display', 'none');
          }
          else {
            $('#loginmsg').html(valid.error(data.message)).fadeIn('slow').delay(2500).fadeOut('slow');
            $('#submitBtn').attr('disabled', false);
            $('#submitBtnText').text('Submit');
            $('#btn_spinner').css('display', 'none');
          }    
        },
        error: function (jqXHR, exception) {
          var msg = valid.ajaxError(jqXHR, exception);
          $('#loginmsg').html(valid.error(msg)).fadeIn('slow').delay(5000).fadeOut('slow');
          $('#submitBtn').attr('disabled', false);
          $('#submitBtnText').text('Submit');
          $('#btn_spinner').css('display', 'none');
        }
      });
      return false;
    }
  });
});