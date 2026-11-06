
function logKey(e)
{
  let gearKeyCode = 103;
  switch (e.keyCode)
  {
    case gearKeyCode:
      gearChange();
      break;
    case 119:
      pitchInput = Math.max(-1, pitchInput - 0.05)
      break;
    case 115:
      pitchInput = Math.min(1, pitchInput + 0.05)
      break;
    case 97:
      rollInput = Math.min(1, rollInput + 0.05)
      break;
    case 100:
      rollInput = Math.max(-1, rollInput - 0.05)
      break;
  }
}