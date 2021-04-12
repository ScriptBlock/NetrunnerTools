var express = require("express");
var app = express();
app.use(express.json()); //Used to parse JSON bodies

var programList = require("./programs")
var iceList = require("./blackices");
const { json } = require("express");

//var archs = []
var archs = [{ "name":"Arasaka Tower", "description": "Default", "owner": 3, "id": 1 }]

var rooms = [{"id":1, "name": "origin", "mapid": 1},
{"id":2, "name": "l2r1", "sourceroom": 1, "mapid": 1},
{"id":3, "name": "l2r2", "sourceroom": 1, "mapid": 1},
{"id":4, "name": "l3r1", "sourceroom": 2, "mapid": 1},
{"id":5, "name": "l3r2", "sourceroom": 3, "mapid": 1},
{"id":6, "name": "l4r1", "sourceroom": 4, "mapid": 1},
{"id":7, "name": "l5r1", "sourceroom": 6, "mapid": 1}
]

/*
           2:l2r1 (controlpoint)  -  4:l3r1 (ice)  - 6:l4r1 (password)  - 7:l5r1 (root)  
1: origin (password)
           3:l2r2 (ice)  -  5:l3r2 (file)
*/


var contenttypes = [
    "password",
    "file",
    "controlnode",
    "root"

]
var roomcontents = [
    {"id": 1, "roomid": 1, "type": "password", "details": "hunter2", "dv":10}, 
    {"id": 2, "roomid": 2, "type": "controlpoint", "details":"turret", "dv":12},
    {"id": 3, "roomid": 6, "type": "password", "details":"l0vemoney", "dv":14},
    {"id": 4, "roomid": 7, "type": "root", "details":"root", "dv":0},
    {"id": 5, "roomid": 5, "type": "file", "details":"Ransom details", "dv":8}

];

var netrunners = [
    {"id": 1, "name": "CrashOverride", "interface": 4, "totalSlots": 3, "speed": 4, "damage": 0, "mapid":1, "roomid":1, "discoveredrooms":[]}
]

var ices = [
    {"id": 1, "name": "Asp", "Per": 4, "Spd": 6, "Atk": 2, "Def": 2, "Rez": 15, "mapid":1, "roomid":4, "tracking": 0},
    {"id": 2, "name": "Giant", "Per": 2, "Spd": 2, "Atk": 8, "Def": 4, "Rez": 25, "mapid":1, "roomid":3, "tracking": 0} 
] //this is active black ices.  full copies of black ices


/*
    { "class": "booster",
      "name": "Eraser",
      "atk": 0,
      "def": 0, 
      "rez": 7,
      "effect": "Increase all Cloak checks you make by +2 as long as this program remains rezzed",
      "maxactivations": -1,
      "activationcount": 0,
      "maxrez": 7,
      "netrunnerid": 1,
      isactivated:0

    },
*/
var programs = [] //this is rezzed programs.  this will be full copies of programs.
var demons = [] 


var initQueue = []; // [{"type": "netrunner", "id": 1}] in descending order


var abilities = [
    "Scanner",
    "Backdoor",
    "Cloak",
    "Control",
    "Eye-Dee",
    "Pathfinder",
    "Slide",
    "Virus",
    "Zap",
    "Password"
]


function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1) ) + min;
}

{ // functions to be refactored... sigh
/*

app.get("/installedprograms/:runnerid", (req, res, next) => {
    console.log("listing installed programs for a netrunner");
    res.json(runners.find(r => r.id == req.params.runnerid).installedPrograms);
});

app.get("/rezzedprograms/:runnerid", (req, res, next) => {
    console.log("listing activated programs for a netrunner");
    var rezzedprograms = [];
    runners.find(r => r.id == req.params.runnerid).rezzedPrograms.forEach(r => {
        rezzedprograms.push(runners.find(r => r.id == req.params.runnerid).installedPrograms.find(p => p.id == r));
    });
    res.json(rezzedprograms);
});

app.get("/activateprogram/:runnerid/:progid", (req, res, next) => {
    let progid = req.params.progid;
    console.log("attempting to activate program: " + progid);
    runners.forEach(r => {
        if(r.id == req.params.runnerid) {
            console.log("found netrunner with ID: " + req.params.runnerid + " - " + r.name);
            var programInstance
             
            if(r.installedPrograms.find(p => p.id == progid) != undefined) {
                console.log("found program with that ID for that netrunner.  checking to make sure it's not already active");
                programInstance = r.installedPrograms.find(p => p.id == progid);
                if(!r.rezzedPrograms.includes(progid)) {
                    console.log("that program does not appear to be rezzed");
                    if(programInstance.activationcount < programInstance.maxactivations || programInstance.maxactivations == -1) {
                        console.log("program has not reached maximum activations");
                        if(programInstance.class.match(/attacker/i)) {
                            console.log("program instance: " + programInstance.name + "[" + programInstance.id + "] is an attacker - auto-derezzing");
                        } else {
                            r.rezzedPrograms.push(progid);
                            r.installedPrograms.forEach(p => {
                                if(p.id == progid) {
                                    p.activationcount = p.activationcount+1;
                                    console.log("incrementing programs activations count to: " + p.activationcount);
                                    console.log("setting programs rez to " + p.maxrez);
                                    p.rez = p.maxrez;
                                }
                            })
                        }
                        console.log("action: " + programInstance.effect);
                    } else {
                        console.log("program has already been activated the maximum number of times");
                    }
                } else {
                    console.log("program id " + progid + " for " + req.params.runnerid + " already rezzed");
                }
            } else {
                console.log("did not find program id: " + progid + " for that netrunner");
            }
        } else {
            console.log("did not find netrunner with id: " + req.params.runnerid);
        }
    });
    res.json(runners);
});

app.get("/deactivateprogram/:runnerid/:progid", (req, res, next) => {
    let progid = req.params.progid;
    console.log("attempting to activate program: " + progid);
    runners.forEach(r => {
        if(r.id == req.params.runnerid) {
            console.log("found netrunner with ID: " + req.params.runnerid + " - " + r.name);
            r.rezzedPrograms = r.rezzedPrograms.filter(x => x != progid);
            console.log("derezzed programid: " + progid);
        }
    });
    res.json(runners);
});


app.get("/damageprogram/:runnerid/:progid", (req, res, next) => {
    let progid = req.params.progid;
    let damage = req.query["damage"];
    console.log("attempting to damage program: " + progid);
    runners.forEach(r => {
        if(r.id == req.params.runnerid) {
            console.log("found netrunner with ID: " + req.params.runnerid + " - " + r.name);
            r.installedPrograms.forEach(p => {
                if(p.id == progid && r.rezzedPrograms.includes(progid)) {
                    console.log("that netrunner has matching program active");
                    //todo check to see if damage would kill program and/or apply damage
                    p.rez -= damage;
                    if(p.rez <= 0) {
                        r.rezzedPrograms = r.rezzedPrograms.filter(x => x != progid);
                        console.log("derezzed programid due to damage: " + progid);            
                    } else {
                        console.log("damaged program");
                    }
                } else {
                    console.log("that netrunning doesn't have that program installed and/or running");
                }
            });
        }
    });
    res.json(runners);
    
});
*/
}

app.post("/program/deactivate/:progid", (req, res, next) => {
    console.log("/program/deactivate called")

    let prog = programs.find(p=>p.id==req.params.progid) 

    if(prog.isactivated == 1) {
        programs = programs.map(p=>p.id == req.params.progid ? {...p, isactivated:0, rez:p.maxrez}:p)
    }
    res.json(programs)
})

app.post("/program/activate/:progid", (req, res, next) => {
    console.log("/program/activate called")

    let prog = programs.find(p => p.id == req.params.progid)
    console.log(`Attempting to activate program id ${prog.id}`)

    if(prog.isactivated != 1) { //this program isn't activated
        if(prog.maxactivations == -1 || prog.activationcount +1 <= prog.maxactivations) {
            programs = programs.map(p => {
                if(p.id == req.params.progid) {
                    p.activationcount += 1
                    if(!p.class.match(/attacker/i)) {
                        p.isactivated = 1
                    }
                    return p
                } else {
                    return p
                }
            })
        } else {
            console.log(`Program has already been activated too many times ${prog.activationcount}/${prog.maxactivations}`)
        }
    } else {
        console.log("program is already activated")
    }
    res.json(programs   )
})

app.get("/program/installed/:netrunnerid", (req, res, next) => {
    console.log("get /program/installed called")

    let retVal = programs.filter(p => p.netrunnerid == req.params.netrunnerid)
    res.json(retVal)

})

app.post("/program/remove/:progid", (req, res, next) => {
    console.log("post /program/remove called")
    programs = programs.filter(p => p.id != req.params.progid)
    res.json(programs)

})

app.post("/program/install/:netrunnerid", (req, res, next) => {
    console.log("post /program/install called")
    
    let programName = req.body.programName
    let netrunner = netrunners.find(n => n.id == req.params.netrunnerid)
    let ipfn = programs.filter(p => p.netrunnerid == req.params.netrunnerid) //installed programs for netrunner (ipnf)

    console.log(`Installing program '${programName}' for Netrunner ${netrunner.id}`)

    if(programName != undefined) {
        let prog = programList.find(p => p.name == programName)
        if(prog != undefined) {
            console.log("Found matching program by name")
            if(ipfn.length < netrunner.totalSlots) {
                console.log("Installing program")
                let newProgID = programs.length > 0 ? programs.reduce((a,b)=>a.id>b.id?a:b).id + 1 : 1
                prog = {...prog, "id": newProgID, "maxrez": prog.rez, "activationcount":0, "netrunnerid": req.params.netrunnerid, "isactivated":0}
                programs = [...programs, prog]
            } else {
                console.log("That netrunner doesn't have enough free spots to install a new program")
            }
        } else {
            console.log("Could not find program by that name")
        }
    }

    res.json(programs) 
 
})



///------------------------  BLACKICE FUNCTIONS ------------------------////
//TODO damage ice
//TODO set tracking

app.post("/ice/:iceid?", (req, res, next) => {
    console.log("post /ice called")

    if(req.params.iceid != undefined && ices.filter(i => i.id == req.params.iceid).length > 0) {
        console.log("Updating existing ICE")
        ices = ices.map(i => i.id == req.params.iceid ? {...i, ...req.body} : i)
    } else {
        console.log("Did not find an ICE with that id, adding a new ICE")

        let targetICEName = req.body.icename
        if(targetICEName != undefined) {
            console.log(`Looking for an ICE with name ${targetICEName}`)
            let newICEID = ices.length > 0 ? ices.reduce((a,b)=>a.id>b.id?a:b).id + 1 : 1
            iceDetails = iceList.find(i => i.name == targetICEName)
            if(iceDetails != undefined) {
                console.log(`Found target ICE program`)
                ices = [...ices, {...iceDetails, "id": newICEID, "roomid": req.body.roomid, "mapid": req.body.mapid, "tracking": req.body.tracking}]
            } else {
                console.log("Wan't able to find that ICE")
            }
        } else {
            console.log("Target iCE to create was not provided")
        }

    }

    res.json(ices);
})

app.delete("/ice/:iceid", (req, res, next) => {
    console.log("delete /ice called")
    ices = ices.filter(i => i.id != req.params.iceid)
    res.json(ices)
})

app.get("/ice/:iceid?", (req, res, next) => {
    console.log("get /ice called")
    let retVal = req.params.iceid != undefined ? ices.filter(i => i.id == req.params.iceid) : ices
    res.json(retVal)
})


///------------------------  MAP PATHFINDING FUNCTIONS ------------------------////

function mapOriginRoom(mapid) {
    return rooms.find(r => r.mapid == mapid && r.sourceroom == undefined)
}

function pathfind(netrunnerid, origin, dvroll) {
    console.log("starting pathfinder")
    console.log(`origin ${origin}`)
	var foundRooms = []

    doroom(netrunnerid, origin, dvroll)

	function doroom(netrunnerid, roomid, dvroll) {
        console.log("==========================================")
        //ease of access
        netrunnerObject = netrunners.find(n => n.id == netrunnerid)

        console.log(`Adding ${roomid} to list of discovered rooms for netrunnerid ${netrunnerid}`)
        foundRooms.push(roomid)
        
        let thisRoomContents = roomcontents.find(contents => contents.roomid == roomid)
        if(thisRoomContents != undefined) {
            console.log(`Roomid ${roomid} contains ${thisRoomContents.type}`)
        }
        let iceList = ices.filter(i => i.roomid == roomid) 
        iceList.forEach(i => { console.log(`Room ${roomid} contains ICE: ${i.name}`)})
        let runnerList = netrunners.filter(n => n.roomid == roomid)
        runnerList.forEach(n => { console.log(`Room ${roomid} contains NETRUNNER: ${n.name}`)})


        //TODO check for ice or other netrunners and show those too

        let nextrooms = rooms.filter(room => room.sourceroom == roomid)

        let nextRoomsAlreadyDiscovered = false
        nextrooms.forEach(r => {
            console.log(`next room down: ${r.id} - netrunner already discovered? (${netrunnerObject.discoveredrooms.includes(r.id)})`)
            //if the netrunner's discovered rooms includes any of the next rooms, go ahead and traverse
            nextRoomsAlreadyDiscovered = netrunnerObject.discoveredrooms.includes(r.id) && true
        })


        let traverseDown = false
        if(nextRoomsAlreadyDiscovered) {
            console.log(`Netrunner ${netrunnerObject.id} already discovered the next rooms, traversing down`)
            traverseDown = true
        } else if(thisRoomContents !== undefined && thisRoomContents.type == "password") {
            if(dvroll >= thisRoomContents.dv) {
                console.log(`Netrunner ${netrunnerObject.id} beat the password DV of ${thisRoomContents.dv} with a ${dvroll}, traversing down`)
                traverseDown = true
            } else {
                console.log(`Netrunner ${netrunnerObject.id} did not beat the password DV of ${thisRoomContents.dv} with a ${dvroll}, preventing traversal`)
            }
        } else if(thisRoomContents == undefined || thisRoomContents.type != "password") {
            console.log(`There is nothing blocking the traversal down`)
            traverseDown = true
        }

        if(traverseDown) {
    		if(nextrooms.length > 0) {
	    		nextrooms.forEach(room => {
                    console.log(`next room to discover ${room.id}`)
				    doroom(netrunnerid, room.id, dvroll)
			    })
            }

        }

	}
	return foundRooms
}

app.post("/pathfind/:netrunnerid/:mapid", (req, res, next) => {
    console.log("post /pathfind called")
    let rolledDV = req.body.dv
    console.log(`rolled DV ${rolledDV}`)

    let origin = mapOriginRoom(req.params.mapid)
    console.log("origin room")
    console.log(origin)

    let discoveredRooms = pathfind(req.params.netrunnerid, origin.id, rolledDV)
    console.log("discoveredRooms: ")
    console.log(discoveredRooms)

    netrunners = netrunners.map(n => {
        if(n.id == req.params.netrunnerid) {
            let a = new Set(n.discoveredrooms)
            discoveredRooms.forEach(d => a.add(d))
            n.discoveredrooms = [...a]
        }
        return n            
    })

    res.json(netrunners)

})

///------------------------  NETRUNNER FUNCTIONS ------------------------////

app.post("/netrunner/:netrunnerid?", (req, res, next) => {
    console.log("post /netrunner called")

    if(req.params.netrunnerid != undefined && netrunners.filter(n => n.id == req.params.netrunnerid).length > 0) {
        console.log("Updating existing netrunner")
        netrunners = netrunners.map(n => n.id == req.params.netrunnerid ? {...n, ...req.body} : n)
    } else {
        console.log("Did not find a netrunner with that id, adding a new netrunner")
        let newNetrunnerID = netrunners.length > 0 ? netrunners.reduce((a,b)=>a.id>b.id?a:b).id + 1 : 1
        netrunners = [...netrunners, {...req.body, "id": newNetrunnerID }]
    }

    res.json(netrunners);
})

app.delete("/netrunner/:netrunnerid", (req, res, next) => {
    console.log("delete /netrunner called")
    netrunners = netrunners.filter(c => c.id != req.params.netrunnerid)
    res.json(netrunners)
})

app.get("/netrunner/:netrunnerid?", (req, res, next) => {
    console.log("get /netrunner called")
    let retVal = req.params.netrunnerid != undefined ? netrunners.filter(n => n.id == req.params.netrunnerid) : netrunners
    res.json(retVal)
})



///------------------------  ROOM CONTENTS FUNCTIONS ------------------------////

app.post("/roomcontents/:roomid/:contentid?", (req, res, next) => {
    console.log("post /roomcontents called")

    let validRoom = rooms.filter(r => r.id == req.params.roomid).length > 0

    if(validRoom) {
        console.log("Found a valid room for content")
        if(req.params.contentid != undefined && roomcontents.filter(c => c.id == req.params.contentid).length > 0) {
            console.log("Updating existing room content")
            roomcontents = roomcontents.map(c => c.id == req.params.contentid ? { ...c, ...req.body}: c)
        } else {
            console.log("Creating new room content")
            let newContentID = roomcontents.length > 0 ? roomcontents.reduce((a,b)=>a.id>b.id?a:b).id + 1 : 1
            roomcontents = [...roomcontents, {...req.body, "roomid": req.params.roomid, "id": newContentID }]

        }
    } else {
        console.log("Specified room does not exist")
    }
    res.json(roomcontents)
})

app.delete("/roomcontents/:contentid", (req, res, next) => {
    console.log("delete /roomcontents called")

    roomcontents = roomcontents.filter(c => c.id != req.params.contentid)

    res.json(roomcontents)

})

app.get("/roomcontents/:roomid/:contentid?", (req, res, next) => {
    console.log("get /roomcontents called")

    let retVal = req.params.contentid != undefined ? roomcontents.filter(c => c.id == req.params.contentid && c.roomid == req.params.roomid) : roomcontents.filter(c => c.roomid == req.params.roomid)

    res.json(retVal)

})

///------------------------  ROOM FUNCTIONS ------------------------////


app.delete("/room/:roomid", (req, res, next) => {
    console.log("delete /room called")
    rooms = rooms.filter(r => r.id != req.params.roomid) 
    res.json(rooms)
})

app.post("/room/:mapid/:roomid?", (req, res, next) => {
    console.log("post /room called")
    let validMap = archs.filter(m => m.id == req.params.mapid).length > 0

    if(validMap) {
        console.log("Found a valid map for room")
        if(req.body.sourceroom == undefined || (req.body.sourceroom != undefined && rooms.filter(r => r.id == req.body.sourceroom).length > 0)) {
            if(req.params.roomid != undefined && rooms.filter(r => r.id == req.params.roomid).length > 0) {
                console.log("Updating existing room")
                rooms = rooms.map(r => r.id == req.params.roomid ? { ...r, ...req.body}: r)
            } else {
                console.log("Creating a new room")
                let newRoomID = rooms.length > 0 ? rooms.reduce((a,b)=>a.id>b.id?a:b).id + 1 : 1
                rooms = [...rooms, {...req.body, "mapid": req.params.mapid, "id": newRoomID }]

            }
        } else {
            console.log("Source room specified does not exist")
        }
    } else {
        console.log("Specified map does not exist")
    }
    res.json(rooms)
})

app.get("/room/:mapid/:roomid?", (req, res, next) => {
    console.log("get /room called")
    let retVal = req.params.roomid != undefined ? rooms.filter(r => r.id == req.params.roomid && r.mapid == req.params.mapid) : rooms.filter(r => r.mapid == req.params.mapid)
    res.json(retVal)
})

///------------------------  MAP FUNCTIONS ------------------------////
app.delete("/map/:mapid", (req, res, next)=>{
    console.log("del /map called")
    archs = archs.filter(m => m.id != req.params.mapid)
    res.json(archs)
})

app.post("/map/:mapid?", (req, res, next)=>{
    console.log("post /map called")
    console.log(req.body)

    if(req.params.mapid != undefined && archs.filter(m => m.id == req.params.mapid).length > 0) {
        console.log("Updating existing map")
        archs = archs.map(m => m.id == req.params.mapid ? {...m, ...req.body} : m)
    } else {
        console.log("Did not find a map with that id, adding a new map")
        let newMapID = archs.length > 0 ? archs.reduce((a,b)=>a.id>b.id?a:b).id + 1 : 1
        archs = [...archs, {...req.body, "id": newMapID }]
    }

    res.json(archs);
    // TODO implment this to send back messages/objects
    // req.newobj = mapCollection;
    // next();
});

app.get("/map/:mapid?", (req, res, next)=>{
    let retVal = req.params.mapid != undefined ? archs.filter(m => m.id == req.params.mapid) : archs
    res.json(retVal)
})


///------------------------ GENERIC FUNCTIONS -------------------------////
app.get("/", (req, res, next) => {
    //let result = programs.filter(program => program.name == "Eraser");
    res.json(mapCollection);
   });

app.use((req, res, next) => {
    //TODO use this middlware to save off the data to something
    console.log("hit middleware");
    res.json(req.newobj);
})

app.listen(3000, () => {
 console.log("Server running on port 3000");
});



{
/*
app.get("/addroom/:mapid/:sourceroom?", (req, res, next) => {
    let thisMap = mapCollection.find(m => m.id == req.params.mapid);
    if(thisMap != undefined) {

        // let newRoom = new Room(++roomCounter);
        let newRoomID = thisMap.rooms.length+1;
        newRoom = new Room(newRoomID);
        console.log("added new room with id: " + newRoomID);
        
        let sourceRoom = req.params.sourceroom;
        if(sourceRoom) {
            console.log("creating a new room that has a source room of " + sourceRoom + " specified, searching");
            thisMap.rooms.map((r) => {
                r.id == req.params.sourceroom && r.linksToRoom.push(newRoomID);
            });
        } else {
            console.log("create a new room with no source room specified");
        }
        thisMap.rooms = [...thisMap.rooms, newRoom];
        //map.push(newRoom);
    } else {
        console.log("couldn't add room, that map doesn't exist");
    }
    res.json(mapCollection);
});

------------SOME OLD TRAVERSAL CODE -------------------

//------- this doesn't work because it wont show password nodes
/*
let thisRoomFound = false;
if(thisRoomContents == undefined || thisRoomContents.type != "password") {
    console.log(`roomid ${roomid} was discovered because there's no contents to stop it`)
    thisRoomFound = true
} else if(netrunners.find(n => n.id == netrunnerid).discoveredrooms.includes(roomid)) {
    console.log(`roomid ${roomid} was discovered because the netrunner already busted through it`)
    thisRoomFound = true
} else if(thisRoomContents.dv <= dvroll) {
    console.log(`roomid ${roomid} was discovered because the netrunner dv roll beat it`)
    thisRoomFound = true
}

if(thisRoomFound) {
    console.log(`added ${roomid} to list of discoveredrooms for netrunner ${netrunnerid}`)
    foundRooms.push(roomid)
    let nextrooms = rooms.filter(room => room.sourceroom == roomid)


    if(nextrooms.length > 0) {
        nextrooms.forEach(room => {
            console.log(`next room to discover ${room.id}`)
            doroom(netrunnerid, room.id, dvroll)
        })
    }
}
*/

//-----------------old old - just uses room DVs.  delete soon
/*
foundRooms.push(rooms.find(room => room.id == r && room.dv <= dvroll).id)
let nextrooms = rooms.filter(room => room.sourceroom == r && room.dv <= dvroll)

if(nextrooms.length > 0) { 
    nextrooms.forEach(room => {
        doroom(room.id, dvroll)
    })
}
*/
}