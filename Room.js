function Room(id) {
    this.id = id;
    this.contains = [];
    this.linksToRoom = [];
    this.dv = 0;
    this.discoveredBy = []; //list of netrunner IDs that have discovered this room
 
}

module.exports= {
    Room: Room
}