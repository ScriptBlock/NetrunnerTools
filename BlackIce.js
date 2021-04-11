// { "class": "Anti-Personnel Black ICE",
// "name": "Asp",
// "Per": 4,
// "Spd": 6,
// "Atk": 2,
// "Def": 2,
// "Rez": 15, 
// "Effect": "Destroys a single program installed on the enemy Netrunner's Cyberdeck at random"
// },

function BlackIce(details) {
    this.id = -1;
    this.name = details.name;
    this.class = details.class;
    this.atk = details.atk;
    this.def = details.def;
    this.per = details.per;
    this.spd = details.spd;
    this.rez = details.rez;
    this.maxrez = this.rez;
    this.effect = details.effect;
    
}

module.exports= {
    BlackIce: BlackIce
}

