function Program(details) {
    this.id = -1;
    this.name = details.name;
    this.class = details.class;
    this.atk = details.atk;
    this.def = details.def;
    this.rez = details.rez;
    this.maxrez = this.rez;
    this.effect = details.effect;
    this.maxactivations = details.maxactivations;    
    this.activationcount = 0;
    
}

module.exports= {
    Program: Program
}

