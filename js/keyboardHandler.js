
function logKey(e)
{
  let G_KEYBOARD = 103;
  switch (e.keyCode)
  {
    case G_KEYBOARD:
      gearChange();
      break;
    case 119:
      realPitch -=0.0005
      break;
    case 115:
      realPitch +=0.0005
      break;
    case 97:
      realRoll +=0.0005
      break;
    case 100:
      realRoll -=0.0005
      break;
  }
}