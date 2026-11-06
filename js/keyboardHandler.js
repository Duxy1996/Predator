
function logKey(e)
{
  let gearKeyCode = 103;
  switch (e.keyCode)
  {
    case gearKeyCode:
      gearChange();
      break;
    case 119:
      pitchInput -=0.0005
      break;
    case 115:
      pitchInput +=0.0005
      break;
    case 97:
      rollInput +=0.0005
      break;
    case 100:
      rollInput -=0.0005
      break;
  }
}