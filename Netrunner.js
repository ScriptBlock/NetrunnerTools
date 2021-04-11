function Netrunner(id) {
    this.id = id;
    this.name = "";
    this.interface = 0;
    this.totalSlots = 0;
    this.speed = 0;
    this.damage = 0;
    this.installedPrograms = [];
    this.rezzedPrograms = [];

}

module.exports= {
    Netrunner: Netrunner
}