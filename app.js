//TODO
// Perform action for netrunner
// Perform actions for ICE
// Build demon code - perform actions for demon
// Update player movement to incorporate immediate action by ICE
// Simple initiative I/O

var express = require("express")
var cors = require('cors')

var app = express()
app.use(cors())
app.use(express.json()) //Used to parse JSON bodies

var programList = require("./programs")
var iceList = require("./blackices")
const { json } = require("express")
const { restart } = require("nodemon")

//var archs = []
var archs = [
    { "name":"Arasaka Tower", "description": "The most secure NET in all of Night City.  You better be a bad-ass before you jack in here.", "owner": 3, "id": 1, "visibletoall": true, "visibleto": [] },
    { "name":"Tiger Claw Drug House", "description": "These guys all share the same computer with no password.  Have fun.", "owner": 3, "id": 2, "visibletoall": true, "visibleto": [] },
    { "name":"Rave - Night Club", "description": "This location contains all of the systems that control the audio/video equipment for the club. ", "owner": 3, "id": 3, "visibletoall": true, "visibleto": [] }

]

var rooms = [{"id":1, "name": "origin", "mapid": 1},
{"id":2, "name": "l2r1", "sourceroom": 1, "mapid": 1},
{"id":3, "name": "l2r2", "sourceroom": 1, "mapid": 1},
{"id":4, "name": "l3r1", "sourceroom": 2, "mapid": 1},
{"id":5, "name": "l3r2", "sourceroom": 3, "mapid": 1},
{"id":6, "name": "l4r1", "sourceroom": 4, "mapid": 1},
{"id":7, "name": "l5r1", "sourceroom": 6, "mapid": 1},
{"id":8, "name": "l6r1", "sourceroom": 7, "mapid": 1},
{"id":9, "name": "l4r2", "sourceroom": 5, "mapid": 1},
{"id":10, "name": "l5r2", "sourceroom": 9, "mapid": 1},
{"id":11, "name": "l4r1", "sourceroom": 5, "mapid": 1}
]

/*
           2:l2r1 (controlpoint)  -  4:l3r1 (ice)  - 6:l4r1 (password-14)  - 7:l5r1 (password-18) - 8:l6r1 (root)  
1: origin (password-10)
           3:l2r2 (ice)           -  5:l3r2 (file) - 9:l4r2 (password-15)  - 10:l5r2 (controlpoint) 

            dv-10: 1,2,4,6,3,5,9 (without access to room 6 configured)
           dv-10: 1,2,4,6,7,3,5,9 (with access to room 6 configured)
           dv-14: 1,2,4,6,7,3,5,9
           dv-15: 1,2,4,6,7,3,5,9,10
           dv-18: 1,2,4,6,7,8,3,5,9,10

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
    {"id": 3, "roomid": 6, "type": "password", "details":"poooop", "dv":14},
    {"id": 4, "roomid": 7, "type": "password", "details":"l0vemoney", "dv":18},
    {"id": 5, "roomid": 8, "type": "root", "details":"root", "dv":0},
    {"id": 6, "roomid": 5, "type": "file", "details":"Ransom details", "dv":8},
    {"id": 7, "roomid": 9, "type": "password", "details": "aaaa", "dv": 15},
    {"id": 8, "roomid": 10, "type": "controlpoint", "details": "guns", "dv": 14}

];

var netrunnerAccess = [
    // {"id": 1, "netrunnerid": 1, "roomid": 6}
]

const defaultNetrunner = {"interface": 4, "slots": 3, "speed": 4, "damage": 0, "discoveredrooms":[], "owner":0, "type": "Other", "reflex":7, "ids":[], "controlpoints":[], "mapid": -1, "roomid": -1}

var netrunners = [
    {"id": 1, "name": "CrashOverride", "interface": 4, "slots": 3, "speed": 4, "damage": 0, "mapid":-1, "roomid":-1, "discoveredrooms":[], "owner":0, "type":"Netrunner", "reflex":7, "ids": [], "controlpoints":[]},
    {"id": 2, "name": "AcidBurn", "interface": 0, "slots": 0, "speed": 4, "damage": 0, "mapid":-1, "roomid":-1, "discoveredrooms":[], "owner":0, "type":"Other", "reflex":7, "ids": [], "controlpoints":[]}

]

var ices = [
    {"id": 1, "name": "Asp", "Per": 4, "Spd": 6, "Atk": 2, "Def": 2, "Rez": 15, "mapid":1, "roomid":4, "tracking": 0, "isactive": 1},
    {"id": 2, "name": "Giant", "Per": 2, "Spd": 2, "Atk": 8, "Def": 4, "Rez": 25, "mapid":1, "roomid":3, "tracking": 0, "isactive": 1} 
] //this is active black ices.  full copies of black ices

var programs = [] //this is rezzed programs.  this will be full copies of programs.
var demons = [] 
var initQueue = [
] // [{"type": "netrunner", "id": 1}] in descending order

/*
    {
        "id": 1,
        "type": "ice",
        "thingID": "2",
        "order": 9
    },
    {
        "id": 2,
        "type": "netrunner",
        "thingID": "1",
        "order": 19
    },
    {
        "id": 3,
        "type": "netrunner",
        "thingID": "2",
        "order": 6
    },
    {
        "id": 4,
        "type": "ice",
        "thingID": "1",
        "order": 22
    }
*/


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

///-----------------------action functions--------------------------------///

app.post("/action/control/:netrunnerid", (req, res, next) => {
    console.log("post /action/slide called")
    dv = Number(req.body.dv)
    roomid = req.body.roomid
    runner = netrunners.find(n => n.id == req.params.netrunnerid)
    let pointToControl = roomcontents.find(c => c.roomid == roomid)
    console.log(`trying to control ${pointToControl.details} with dv of ${dv}`)
    if(!runner.controlpoints.includes(pointToControl.id)) {
        console.log("runner hasn't already controlled that point")
        if(dv >= pointToControl.dv) {
            console.log("rolled dv was high enough to control that point")
            netrunners = netrunners.map(r => r.id == req.params.netrunnerid ? {...r, controlpoints: [...r.ids, pointToControl.id]} : r)
        } else {
            console.log("rolled dv not high enough to control that point")
        }
    } else {
        console.log("runner already has the point controlled")
    }
    res.json(netrunners)
})

app.post("/action/id/:netrunnerid", (req, res, next) => {
    console.log("post /action/slide called")
    dv = Number(req.body.dv)
    roomid = req.body.roomid
    runner = netrunners.find(n => n.id == req.params.netrunnerid)
    let fileToID = roomcontents.find(c => c.roomid == roomid)
    console.log(`trying to ID ${fileToID.details} with dv of ${dv}`)
    if(!runner.ids.includes(fileToID.id)) {
        console.log("runner hasn't already IDd that file")
        if(dv >= fileToID.dv) {
            console.log("rolled dv was high enough to ID that file")
            netrunners = netrunners.map(r => r.id == req.params.netrunnerid ? {...r, ids: [...r.ids, fileToID.id]} : r)
        } else {
            console.log("rolled dv not high enough to ID that file")
        }
    } else {
        console.log("runner already has the file IDd")
    }
    res.json(netrunners)
})

app.post("/action/slide/:netrunnerid", (req, res, next) => {
    console.log("post /action/slide called")
    dv = Number(req.body.dv)
    runner = netrunners.find(n => n.id == req.params.netrunnerid)
    trackingIce = ices.find(i = i.tracking == runner.id) //TODO what if there's more than 1
    if(dv >= iceDVroll) { //TODO dereive iceDVroll
        // console.log("the player's DV was sufficient to slide.  Escaping")
        ices = ices.map(i => i.id == trackingIce.id ? {...i, "tracking":0} : i)
    } else {
        // console.log("player's DV for slide failed")
        //TODO what's the consequence
    }

    res.json(ices)
})

app.post("/enterpassword/:roomid/:netrunnerid", (req, res, next) => {
    console.log(`post /enterpassword called`)
    let runner = netrunners.find(n => n.id == req.params.netrunnerid)
    let content = roomcontents.find(c => c.roomid == req.params.roomid && c.type == "password")
    let existingAccess = netrunnerAccess.find(a => a.roomid == content.roomid && a.netrunnerid == runner.id)
    let password = req.body.pwd

    if(existingAccess == undefined) {
        if(runner != undefined && content != undefined && password != undefined) {
            // console.log(`Entering password ${password} for room ${content.roomid} by netrunner ${runner.id}`)
            if(content.details == password) {
                // console.log("Password entered successfully")
                let newAccessID = netrunnerAccess.length > 0 ? netrunnerAccess.reduce((a,b)=>a.id>b.id?a:b).id + 1 : 1
                netrunnerAccess = [...netrunnerAccess, {"id":newAccessID, "netrunnerid": runner.id, "roomid": content.roomid}]
            } else {
                // console.log("invalid password")
            }
        }
    } else {
        // console.log("That netrunner already has access to that room")
    }
    res.json(netrunnerAccess)

})

app.post("/backdoor/:roomid/:netrunnerid", (req, res, next) => {
    console.log(`post /backdoor called roomid is ${req.params.roomid}`)
    let runner = netrunners.find(n => n.id == req.params.netrunnerid)
    let content = roomcontents.find(c => c.roomid == req.params.roomid && c.type == "password")
    let existingAccess = netrunnerAccess.find(a => a.roomid==req.params.roomid && a.netrunnerid==req.params.netrunnerid)
    let dv = req.body.dv

    if(existingAccess != undefined) {
        // console.log(`The specified netrunner ${req.params.netrunnerid} and roomid ${req.params.roomid} access is already granted`)
    } else if(runner == undefined) {
        // console.log("The specified choomba doesn't exist")
    } else {
        if(content != undefined && dv != undefined) {
            if(dv >= content.dv) {
                // console.log(`Provided DV (${dv} beats or equals password dv of ${content.dv})`)
                let newAccessID = netrunnerAccess.length > 0 ? netrunnerAccess.reduce((a,b)=>a.id>b.id?a:b).id + 1 : 1
                netrunnerAccess = [...netrunnerAccess, {"id":newAccessID, "netrunnerid": req.params.netrunnerid, "roomid": req.params.roomid}]
            }
        } else {
            // console.log(`content is ${content} for dv is ${dv}`)
        }
    }
    res.json(netrunnerAccess)
})


///------------------------  PROGRAMS FUNCTIONS ------------------------////

app.get("/programs", (req, res, next) => {
    res.json(programList)

})

app.get("/programs/rezzed/:netrunnerid", (req, res, next) => {
    let retVal = programs.filter(p=>p.netrunnerid==req.params.netrunnerid && p.isactivated==1)
    res.json(retVal)
})

app.post("/programs/damage/:progid", (req, res, next) => {
    console.log("/programs/damage called")
    let prog = 
    
    programs.find(p=>p.id=req.params.progid)
    let damage = req.body.damage
    if(prog != undefined && prog.isactivated == 1 && damage > 0)  {
        console.log(`Applying ${damage} damage to progid ${prog.id}`)
        programs = programs.map(p => {
            if(p.id == req.params.progid) {
                p.rez -= damage
                if(p.rez <= 0) {
                    console.log("Damage has killed the program.  Derezzing")
                    p.isactivated = 0
                    p.rez = 0
                }
            }
            return p
        })
    } else {
        console.log(`program ${req.params.progid} is not activated or damage was < 0`)
    }
    res.json(programs)

})

app.post("/programs/deactivate/:progid", (req, res, next) => {
    console.log("/program/deactivate called")

    let prog = programs.find(p=>p.id==req.params.progid) 

    if(prog != undefined && prog.isactivated == 1) {
        programs = programs.map(p=>p.id == req.params.progid ? {...p, isactivated:0, rez:p.maxrez}:p)
    }

    res.json(programs)
})

app.post("/programs/activate/:progid", (req, res, next) => {
    console.log("/programs/activate called")

    let prog = programs.find(p => p.id == req.params.progid)
    console.log(`Attempting to activate program id ${prog.id}`)

    if(prog.isactivated != 1) { //this program isn't activated
        if(prog.maxactivations == -1 || prog.activationcount +1 <= prog.maxactivations) {
            programs = programs.map(p => {
                if(p.id == req.params.progid) {
                    p.activationcount += 1
                    p.rez = p.maxrez
                    if(!p.class.match(/attacker/i)) {
                        p.isactivated = 1
                    }
                } 
                return p
            })
        } else {
            console.log(`Program has already been activated too many times ${prog.activationcount}/${prog.maxactivations}`)
        }
    } else {
        console.log("program is already activated")
    }
    res.json(programs   )
})

app.get("/programs/installed/:netrunnerid", (req, res, next) => {
    console.log("get /program/installed called")
    let retVal = programs.filter(p => p.netrunnerid == req.params.netrunnerid)
    res.json(retVal)

})

app.delete("/programs/remove/:progid", (req, res, next) => {
    console.log("post /program/remove called")
    programs = programs.filter(p => p.id != req.params.progid)
    res.json(programs)

})

app.post("/programs/install/:netrunnerid", (req, res, next) => {
    console.log("post /program/install called")
    
    let programName = req.body.programName
    let netrunner = netrunners.find(n => n.id == req.params.netrunnerid)
    let ipfn = programs.filter(p => p.netrunnerid == req.params.netrunnerid) //installed programs for netrunner (ipnf)

    if(netrunner != undefined) {
        console.log(`Installing program '${programName}' for Netrunner ${netrunner.id}`)

        if(programName != undefined) {
            let prog = programList.find(p => p.name == programName)
            if(prog != undefined) {
                console.log("Found matching program by name")
                if(ipfn.length < netrunner.slots) {
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
    }
    res.json(programs) 
 
})



///------------------------  BLACKICE FUNCTIONS ------------------------////
app.post("/ice/damage/:iceid", (req, res, next) => {
    console.log("post /ice/damage called")
    let ice = ices.find(i => i.id==req.params.iceid)
    let damage = req.body.damage
    if(ice != undefined && damage != undefined && damage > 0) {
        console.log(`found target ice, damaging by ${damage}`)
        ices = ices.map(i => {
            if(i.id == req.params.iceid) {
                i.Rez -= damage
                if(i.Rez <= 0) {
                    console.log(`ICE ${i.name} has been derezzed from damage`)
                    i.Rez = 0
                    i.isactive = 0
                }
            }
            return i
        }) 
    } else {
        console.log("could not apply damage")
    }
    res.json(ice)
})

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

function pathfind(netrunnerid, origin, dvroll, maxDepth) {
    console.log("starting pathfinder")
    console.log(`origin ${origin}`)
	var foundRooms = []

    doroom(netrunnerid, origin, dvroll, 0)

	function doroom(netrunnerid, roomid, dvroll, currentDepth) {
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
        iceList.forEach(i => { console.log(`Room ${roomid} contains ICE: ${i.name} ${i.isactive == 0 ? "(dead)" : "(alive)"}`)})
        let runnerList = netrunners.filter(n => n.roomid == roomid)
        runnerList.forEach(n => { console.log(`Room ${roomid} contains NETRUNNER: ${n.name}`)})

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
            let roomAccess = netrunnerAccess.find(a => a.roomid == roomid && a.netrunnerid == netrunnerid)
            if(roomAccess != undefined) {
                console.log(`Pre-existing access exists for roomid ${roomid}`)
                traverseDown = true
            } else {
                //this part means that if the user's role beats the password DV then the netrunner can see past the password but not actually move down
                //alternatively, this whole thing can be removed and then the only way to pathfind past a password is to have the password or backdoor it
                if(dvroll >= thisRoomContents.dv) {
                    console.log(`Netrunner ${netrunnerObject.id} beat the password DV of ${thisRoomContents.dv} with a ${dvroll}, traversing down`)
                    traverseDown = true
                } else {
                    console.log(`Netrunner ${netrunnerObject.id} did not beat the password DV of ${thisRoomContents.dv} with a ${dvroll}, preventing traversal`)
                }
            }
        } else if(thisRoomContents == undefined || thisRoomContents.type != "password") {
            console.log(`There is nothing blocking the traversal down`)
            traverseDown = true
        }

        if(currentDepth+1 > maxDepth) {
            console.log("reached max depth")
            traverseDown = false
        }

        if(traverseDown) {
    		if(nextrooms.length > 0) {
	    		nextrooms.forEach(room => {
                    console.log(`next room to discover ${room.id}`)
				    doroom(netrunnerid, room.id, dvroll, currentDepth+1)
			    })
            }

        }

	}
	return foundRooms
}

const addNetrunnerDiscoveredRooms = (netrunnerid, roomlist) => {
    console.log(`adding rooms ${roomlist} to the disovered rooms for nr ${netrunnerid}`)
    netrunners = netrunners.map(n => {
        if(n.id == netrunnerid) {
            let a = new Set(n.discoveredrooms)
            roomlist.forEach(d => a.add(d))
            n.discoveredrooms = [...a]
        }
        return n            
    })

}

app.post("/pathfind/:netrunnerid/:mapid", (req, res, next) => {
    console.log("post /pathfind called")
    let rolledDV = req.body.dv
    let startingRoom = req.body.startingroom
    let maxDepth = req.body.maxdepth

    console.log(`rolled DV ${rolledDV}`)

    let origin = mapOriginRoom(req.params.mapid).id

    if(startingRoom != null) {
        console.log("pathfinder was passed a starting room, using that instead of mapOrigin")
        origin = startingRoom
    }
    console.log("origin room")
    console.log(origin)

    let discoveredRooms = pathfind(req.params.netrunnerid, origin, rolledDV, maxDepth)
    console.log("discoveredRooms: ")
    console.log(discoveredRooms)

    // netrunners = netrunners.map(n => {
    //     if(n.id == req.params.netrunnerid) {
    //         let a = new Set(n.discoveredrooms)
    //         discoveredRooms.forEach(d => a.add(d))
    //         n.discoveredrooms = [...a]
    //     }
    //     return n            
    // })
    addNetrunnerDiscoveredRooms(req.params.netrunnerid, discoveredRooms)

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
        netrunners = [...netrunners, {...defaultNetrunner, ...req.body, "id": newNetrunnerID }]
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
    retVal = retVal.map(r => ({...r, programs: programs.filter(p => p.netrunnerid == r.id)}))
    res.json(retVal)
})

const doNetrunnerMove = (netrunnerid, targetroomid) => {
    console.log(`movinb nr ${netrunnerid} to room ${targetroomid}`)

    netrunners = netrunners.map(n => n.id == netrunnerid ? { ...n, "roomid": targetroomid}:n)
    iceInRoom = ices.find(i => i.roomid == targetroomid)
    if(iceInRoom != undefined) {
        if(iceInRoom.tracking == 0) {
            console.log("there was ice in that room that wasn't busy tracking another netrunner")
            ices = ices.map(i => i.id == iceInRoom.id ? { ...i, "tracking": netrunnerid} : i)
            setInitiative("ice", iceInRoom.id, "top")
            //TODO figure out netrunner DV check vs. ice check.  figure out how to alert netrunners of applied effect
            //if(rolledInitiative < iceInRoom.initiativeCheck) {
            //console.log(iceList.find(il => il.name == iceInRoom.name).Effect)
        } else {
            console.log("encountered ICE is already tracking another netrunner")
        }
    }

}

app.post("/netrunner/:netrunnerid/movedown", (req, res, next) => {
    let runner = netrunners.find(n => n.id == req.params.netrunnerid)
    let sourceRoom = rooms.find(r => r.id == runner.roomid)
    let possibleTargetRooms = rooms.filter(r => r.sourceroom == sourceRoom.id)
    let sourceRoomContent = roomcontents.find(c => c.roomid == sourceRoom.id)

    let targetRoom = possibleTargetRooms[Math.floor(Math.random()*possibleTargetRooms.length)]
    console.log(`moving to target room ${targetRoom.id}`)

    if(sourceRoomContent != undefined && sourceRoomContent.type == "password") { 
        console.log("The room they are trying to leave is password protected")
        if(netrunnerAccess.find(a => a.netrunnerid == runner.id && a.roomid == sourceRoom.id) != undefined) {
            console.log("They have already unlocked this password")
            moveToTargetRoom = true
        } else {
            console.log("This password has not yet been bypassed")
        }
    } else {
        console.log("This room contents isn't a blocker and has been discovered to allowing movement")
        moveToTargetRoom = true
    }

    if(moveToTargetRoom) {
        addNetrunnerDiscoveredRooms(runner.id, [targetRoom.id])
        doNetrunnerMove(runner.id, targetRoom.id)
    }

    res.json(netrunners)

})

app.post("/netrunner/:netrunnerid/move/:targetroom", (req, res, next) => {
    console.log("post netrunner/nid/move/room called")

    let runner = netrunners.find(n => n.id == req.params.netrunnerid)
    let targetRoom = rooms.find(r => r.id == req.params.targetroom)
    let sourceRoom = rooms.find(r => r.id == runner.roomid)
    let sourceRoomContent = roomcontents.find(c => c.roomid == sourceRoom.id)

    let targetRoomDiscovered = runner.discoveredrooms.includes(targetRoom.id)
    console.log(`Target room has already been discovered ${targetRoomDiscovered != undefined}`)

    let direction = targetRoom.id == sourceRoom.sourceroom ? "backwards" : "forwards"
    console.log(`The requested movement is ${direction}`)

    let moveToTargetRoom = false
    
    if(direction == "backwards") {
        console.log("Allowing movement, the direction is backwards")
        moveToTargetRoom = true
    } else {
        if(targetRoomDiscovered) {
            console.log("The requested next room has been discovered...")
            if(sourceRoomContent != undefined && sourceRoomContent.type == "password") { 
                console.log("The room they are trying to leave is password protected")
                if(netrunnerAccess.find(a => a.netrunnerid == runner.id && a.roomid == sourceRoom.id) != undefined) {
                    console.log("They have already unlocked this password")
                    moveToTargetRoom = true
                } else {
                    console.log("This password has not yet been bypassed")
                }
            } else {
                console.log("This room contents isn't a blocker and has been discovered to allowing movement")
                moveToTargetRoom = true
            }
        } else {
            console.log("Blocking movement as the requested room hasn't been discovered")
        }
    }

    if(moveToTargetRoom) {
        doNetrunnerMove(runner.id, targetRoom.id)

        // netrunners = netrunners.map(n => n.id == runner.id ? { ...n, "roomid": targetRoom.id}:n)
        // iceInRoom = ices.find(i => i.roomid)
        // if(iceInRoom != undefined) {
        //     if(iceInRoom.tracking == 0) {
        //         console.log("there was ice in that room that wasn't busy tracking another netrunner")
        //         ices.map(i => i.id == iceInRoom.id ? { ...i, "tracking": runner.id} : i)
        //         setInitiative("ice", iceInRoom.id, "top")
        //         //TODO build in the netrunner initiative check 
        //         //if(rolledInitiative < iceInRoom.initiativeCheck) {
        //         //console.log(iceList.find(il => il.name == iceInRoom.name).Effect)
        //     } else {
        //         console.log("encountered ICE is already tracking another netrunner")
        //     }
        // }
    }

    res.json(netrunners)
})

///------------------------  ROOM CONTENTS FUNCTIONS ------------------------////
//TODO there's a bug here.  when you call upate you can update a content iD that has a mismatched room id.  
//its no big deal because the roomid passed in doesn't do anything on a content update, only there to validate for new items

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

app.get("/mapcontents/:mapid", (req, res, next) => {
    console.log("get /mapcontents called")

    let contentsForMap = rooms.map(r => roomcontents.find(c => c.roomid == r.id))
    contentsForMap = contentsForMap.filter(c => c != null)
    console.log("rooms for map")
    console.log(contentsForMap)

    res.json(contentsForMap)
})

app.get("/roomcontents/:roomid/:contentid?", (req, res, next) => {
    console.log("get /roomcontents called")

    let retVal = req.params.contentid != undefined ? roomcontents.filter(c => c.id == req.params.contentid && c.roomid == req.params.roomid) : roomcontents.filter(c => c.roomid == req.params.roomid)

    res.json(retVal)

})

//TODO write a function that returns all of the rooms and contents with appropriate visibility rules as an all-in-one object to make the UI easier.

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


//GOTO
app.get("/room/:mapid/:roomid?", (req, res, next) => {
    console.log("get /room called")
    let ownedCharacter = req.query["ownedcharacter"]
    let gatherContext = req.query["gathercontext"]


    let mapOrigin = rooms.find(r => r.mapid = req.params.mapid && r.sourceroom == undefined).id

    let origRooms = req.params.roomid != undefined ? rooms.filter(r => r.id == req.params.roomid && r.mapid == req.params.mapid) : rooms.filter(r => r.mapid == req.params.mapid)
    let retVal = origRooms
    
    
    if(ownedCharacter != null) {
        // console.log("a character id was passed in, getting just rooms for that character")

        if(!netrunners.find(n => n.id == ownedCharacter).discoveredrooms.includes(mapOrigin)) {
            // console.log("that character didn't have the origin room for this map, adding")
            netrunners = netrunners.map(n => n.id == ownedCharacter ? {...n, discoveredrooms: [...n.discoveredrooms, mapOrigin]} : n)
        }
        retVal = retVal.filter(r => netrunners.find(n => n.id == ownedCharacter).discoveredrooms.includes(r.id))
        
        // console.log(retVal)
        // console.log("----------------------------------------------")

    }

    if(gatherContext != null && gatherContext == "true") {

        //if there are rooms that link to this, add "hasexits" so that the modal knows to show a "move down" button
        retVal = retVal.map(r => origRooms.filter(o => o.sourceroom == r.id).length > 0 ? {...r, "hasexits":true} : r)


        //put the contents into the room from the master list - default the room to not open.  this roomopen marker is used to help draw buttons.  
        retVal = retVal.map(r => ({...r, "contents":roomcontents.find(rc => rc.roomid == r.id)}))

        //default the password protected rooms to not open.  the next logic will set them open as appropriate
        retVal = retVal.map(r => r.contents != undefined && r.contents.type == "password" ? {...r, "roomopen":false} : r)

        //loop through the netrunner access.  if this room is one that has access then say room open = true.  this is really only valid for password protected rooms
        retVal = retVal.map(r => netrunnerAccess.find(n => n.netrunnerid == ownedCharacter && n.roomid == r.id) ? { ...r, "roomopen": true} : { ...r })

        //loop through any possible ices and attach
        retVal = retVal.map(r => ({...r, "ices": ices.filter(i=>i.roomid==r.id)}))

        // console.log(retVal)
        // console.log("----------------------------------------------")

    }  

    res.json(retVal)
})

///------------------------  MAP FUNCTIONS ------------------------////
app.post("/map/jackin/:netrunnerid/:mapid", (req, res, next) => {
    let netrunnerid = req.params.netrunnerid
    let mapid = req.params.mapid

    console.log(`jacking in netrunner ${netrunnerid} into map ${mapid}`)
    let retVal = {}
    let runnerCurrentMap = netrunners.find(n => n.id == netrunnerid).mapid
    if(runnerCurrentMap == -1) {
        //netrunner isn't already jacked in - go through jackin setup
        netrunners = netrunners.map(n => n.id == netrunnerid ? {...n, "mapid": mapid, "roomid": 1} : n)
        retVal = {"result": {"message": "Netrunne Jacked In Successfully", "code": 200}, "payload":netrunners.find(n => n.id == netrunnerid)}
    } else {
        retVal = {"result": {"message": "Netrunner Already Jacked In", "code": 500}, "payload":netrunners.find(n => n.id == netrunnerid)}
        //netrunner is already jacked in somewhere else.  don't bother 
    }

    res.json(retVal)


})

app.post("/map/jackout/:netrunnerid", (req, res, next) => {
    let netrunnerid = req.params.netrunnerid
    console.log(`jacking out netrunner ${netrunnerid}`)

    let retVal = {}
    let runnerCurrentMap = netrunners.find(n => n.id == netrunnerid).mapid

    if(runnerCurrentMap != -1) {
        console.log("jacking out netrunner")
        //runner is indeed jacked in - go through jackout steps
        let candidateIces = ices.filter(i => i.isactive == 1 && i.tracking == netrunnerid)
        let effects = candidateIces.map(i => ({"source": i.name, "effect": iceList.find(ice => ice.name == i.name).Effect}))
        netrunners = netrunners.map(n => n.id == netrunnerid ? {...n, "mapid": -1, "roomid":-1, "discoveredrooms":[]}: n)
        programs = programs.map(p => p.netrunnerid == netrunnerid ? {...p, "isactivated":0, "activationcount": 0, "rez": p.maxrez} : p)
        //TODO clear candidate ice tracking indicator
        console.log(effects)
        retVal = {"result": {"message": "Netrunner Jacked Out - Effects In Payload", "code": 200}, "payload":effects}
    } else {
        //runner isn't jacked in
        retVal = {"result": {"message": "Netrunner Isn't Jacked In To An Architecture", "code": 500}, "payload":netrunners.find(n => n.id == netrunnerid)}
    }
    res.json(retVal)
})


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

app.get("/map/:mapid", (req, res, next)=>{
    //let playerID = req.body.playerID
    let retVal = archs.find(m => m.id == req.params.mapid)
    // if(playerID == "gm") {
    //     retVal = archs.find(m => m.id == req.params.mapid)
    // } else {
    //     retVal = archs.find(m => m.id == req.params.mapid && (m.visibletoall || m.visibleto.includes(playerID)))
    // }
    res.json(retVal)
})

app.get("/maps", (req, res, next)=>{
    let playerID = req.query["playerID"]
    let retVal = {}
    if(playerID != undefined) {
        if(playerID == "gm") {
            retVal = archs
        } else {
            retVal = archs.filter(m => m.visibletoall || m.visibleto.includes(playerID))
        }    
    }
    res.json(retVal)
})




///-------------------------initiative functions----------------------//////
function setInitiative(initType, thingID, roll) {

    //Set the roll value to the top of the initiative if roll=="top"
    if(roll == "top") {
        if(initQueue.length == 0) {
            roll=1
        } else {
            roll = (initQueue.reduce((a,b)=>a.order>b.order?a:b).order)+1
        }
    }
    //roll = roll == "top" ? (initQueue.reduce((a,b)=>a.order>b.order?a:b).order)+1 : roll
    roll = Number(roll)
    let existingThing = initQueue.find(q => q.thingID == thingID && q.type == initType) //if we find the thing, time to change the thing

    if(existingThing != undefined) {
        initQueue = initQueue.map(q => q.id == existingThing.id ? {...q, "thingID": thingID, "type": initType, "order": roll, "active": false} : q)
    } else {
        let newQueueID = initQueue.length > 0 ? initQueue.reduce((a,b)=>a.id>b.id?a:b).id + 1 : 1
        initQueue = [...initQueue, {"id": newQueueID, "type": initType, "thingID": thingID, "order": roll, "active": false}]
    }
    return null
}

app.get("/initiative", (req, res, next) => {
    console.log("get /initiative called")
    let sortedFlag=req.query["sort"]


    if(sortedFlag != undefined) {
        // console.log("returning sorted list")
        let sorted = initQueue.sort((a, b) => (a.order > b.order) ? -1 : 1)
        res.json(sorted)
    } else {
        res.json(initQueue)
    }

})

app.post("/setactiveinit/:id", (req, res, next) => {
    console.log("post /setactiveinit called")
    initQueue = initQueue.map(q => q.id == req.params.id ? {...q, active: true} : {...q, active: false})
    res.json(initQueue)
})

app.post("/initiative/next", (req, res, next) => {
    console.log("called next initiative")
    let sorted = initQueue.sort((a, b) => (a.order > b.order) ? -1 : 1)

    let nextActive = -1
    sorted.forEach((i, j) => {
        if(i.active) {
            // console.log(`found the current active - array item ${j} - id ${i.id}`)
            if(j+1 == sorted.length) {
                // console.log("reached end of init")
                nextActive = sorted[0].id
            } else {
                // console.log("moving to next - not at end")
                nextActive = sorted[j+1].id
            }
        }
    })
    initQueue = initQueue.map(q => q.id == nextActive ? {...q, active: true} : {...q, active: false})
    res.json(initQueue)
})

app.post("/initiative/:initType/:id", (req, res, next) => {
    console.log("post /initiative called")
    let rollValue = req.body.roll

    if(rollValue) {
        // console.log("A roll was passed, updating initQueue")
        setInitiative(req.params.initType, req.params.id, rollValue)        
    } else {
        // console.log("No roll was passed")
    }

    res.json(initQueue)
})

app.delete("/initiative/:initID?", (req, res, next) => {
    console.log("delete /initiative called")
    if(req.params.initID != undefined && req.params.initID != null) {
        initQueue = initQueue.filter(q => q.id != req.params.initID)
    } else {
        initQueue = []
    }
    
    res.json(initQueue)
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