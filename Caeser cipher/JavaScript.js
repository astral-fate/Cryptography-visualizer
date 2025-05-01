$(function(){
    var shift = 0;
    function encipher()
    {
        var longalpha='aAbBcCdDeEfFgGhHiIjJkKlLmMnNoOpPqQrRsStTuUvVwWxXyYzZ';
        var plaintext = $('#plaintext textarea').val();
        var ciphertext = plaintext.split('').map(function(a) {
            return (s=longalpha.indexOf(a))>=0 ? longalpha[(s+shift*2) % 52] : a;
        }).join('');
        $('#ciphertext textarea').val(ciphertext);
    };


    var alphabet='abcdefghijklmnopqrstuvwxyz';
    for(var i=0;i<26;i++)
    {
        $('#cipher #top').append('<div class="letter">'+alphabet[i]+'</div>');
    }
    $('#cipher #top .letter')
        .clone().appendTo('#letters');

    var o1=$('#cipher #bottom').offset();

    var scroll = 0, oScroll = 0;
    $('#cover').draggable({
        axis: 'x',
        drag: function(e, ui) {
            var nScroll = $(this).position().left
            scroll += nScroll - oScroll;
            oScroll = nScroll;
            var first = $('#letters .letter:first');
            var w = first.width();
            while(scroll < -w && w>0)
            {
                first.appendTo('#letters');
                scroll+=w;
                shift += 1;
                first = $('#letters .letter:first');
                w = first.width();
            }
            var last = $('#letters .letter:last');
            w = last.width();
            while(scroll > w && w>0)
            {
                last.prependTo('#letters');
                scroll-=w;
                shift -= 1;
                last = $('#letters .letter:last');
                w = last.width();
            }
            shift = shift % 26;
            if(shift<0)
                shift+=26;

            $('#shift').html('Shift: '+shift);
        },
        stop: function(e,ui) {
            $(this).css('left',0);
            scroll = oScroll = 0;
        }
    });

    $('#cover').bind('drag',encipher);
    $('#plaintext').bind('input',encipher);

    encipher();
    
});
  
  function resetText() {
   
    document.getElementById("ciphertextArea").value = "";
    document.getElementById("plaintextArea").value = "";
   
  }

  function copyToClipboardciphertextArea() {
    var textarea = document.getElementById("ciphertextArea");
  
    // Select the text inside the textarea
    textarea.select();
    textarea.setSelectionRange(0, 99999); // For mobile devices
  
    // Copy the selected text to clipboard
    document.execCommand("copy");
  
    // Deselect the text
    textarea.setSelectionRange(0, 0);
  }
  function copyToClipboardplaintextArea() {
    var textarea = document.getElementById("plaintextArea");
  
    // Select the text inside the textarea
    textarea.select();
    textarea.setSelectionRange(0, 99999); // For mobile devices
  
    // Copy the selected text to clipboard
    document.execCommand("copy");
  
    // Deselect the text
    textarea.setSelectionRange(0, 0);
  }
  
  
 
    