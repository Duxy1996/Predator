class Gauge
{
  constructor(name)
  {
    this.name        = name;
    this.threeObject = [];
    this.threePivote = [];
    this.isAttached  = true;
  }

  getName()
  {
    return this.name;
  }

  getObject()
  {
    return this.threeObject;
  }

  setName(name)
  {
    this.name = name;
  }

  setObject(threeObject)
  {
    this.threeObject.push(threeObject);
  }

  setPivote(threePivote)
  {
    this.threePivote.push(threePivote);
  }
}