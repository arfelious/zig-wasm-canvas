
let wanderer = {create:function(){
    const DEFAULT_COLOR_NUM = 0x0099ff
    const DEFAULT_COLOR = "#ff9900"
    let noop = ()=>{}
    let options = {}
    options.DEFAULT_COLOR = DEFAULT_COLOR
    options.onInstantiate = noop
    let inputValues = {"iterationCount":10000,"intendedCount":1000,"intendedWidth":120,"intendedHeight":120,"goalWidth":360,"goalHeight":360,"color":DEFAULT_COLOR_NUM}
    let defaultValues = {...inputValues}
    let restartAnimation = ()=>{
        resetCanvas(wasmCanvas,inputValues,context,canvas,options)
    }
    options.inputs=[{
        type:"slider",
        scale:"log",
        min:1,
        max:1e6,
        value:1e4,
        label:"Iteration Count",
        id:"iterationCount",
        onChange:(ev)=>{
            inputValues.iterationCount = ev.target.value
        }
    },
    {
        type:"slider",
        scale:"log",
        min:1,
        max:1e4,
        value:1000,
        label:"Intended Count",
        id:"intendedCount"
    },
    {
        type:"slider",
        scale:"log",
        min:1,
        max:720,
        value:120,
        label:"Intended Width",
        id:"intendedWidth"
    },
    {
        type:"slider",
        scale:"log",
        min:1,
        max:720,
        value:120,
        label:"Intended Height",
        id:"intendedHeight"
    },
    {
        type:"slider",
        scale:"log",
        min:1,
        max:1e3,
        value:360,
        label:"Goal Width",
        id:"goalWidth"
    },
    {
        type:"slider",
        scale:"log",
        min:1,
        max:1e3,
        value:360,
        label:"Goal Height",
        id:"goalHeight"
    },
    {
        type:"text",
        value:DEFAULT_COLOR,
        label:"Color",
        id:"color"
    },{
        type:"button",
        label:"Restart",
        id:"restart",
        onChange:restartAnimation
    
    },{
        type:"button",
        label:"Reset",
        id:"reset",
        onChange:(val)=>{
            options.inputElements.forEach(([element,input])=>{
                element.value = defaultValues[input.id]
            })
            inputValues = {...defaultValues}
            restartAnimation()
        }
    }
    ]
    options.isWasm=true
    options.canvasCount = 1
    options.title="Wanderer"
    let wasmOptions = {}
    wasmOptions.pageCount = 128
    wasmOptions.url="/interactive/zig/wanderer/zig-out/bin/interactive.wasm"
    wasmOptions.importObject = {jsRand:(max,limit)=>limit?Math.floor(Math.random()*(max-2))+1:Math.floor(Math.random()*max)}
    let wasmCanvas = {memory:null,offset:null}
    let canvas=null,context = null
    wasmOptions.onInstantiate=(canvasArr,instance,memory,state,eventLoops)=>{
        const wasmMemoryArray = new Uint8Array(memory.buffer);
        canvas = canvasArr[0]
        context = canvas.getContext("2d");
        context.imageSmoothingEnabled = false;
        const bufferOffset = instance.exports.getCanvasBufferPointer();
        wasmCanvas.memory = wasmMemoryArray
        wasmCanvas.offset = bufferOffset
        const draw = async ()=>{
            if(!state.isPlaying)return
            let iterationCount = inputValues.iterationCount||10000
            let intendedCount = inputValues.intendedCount||1000
            let intendedWidth = inputValues.intendedWidth||120
            let intendedHeight = inputValues.intendedHeight||120
            let goalWidth = inputValues.goalWidth||360
            let goalHeight = inputValues.goalHeight||360
            let colorNum = inputValues.color||defaultValues.color
            instance.exports.iterate(intendedCount,iterationCount,intendedWidth,intendedHeight,colorNum)
            let imageDataArray = new Uint8ClampedArray(wasmMemoryArray.slice(bufferOffset, bufferOffset + intendedWidth * intendedHeight * 4));
            let tempBitmap = await window.createImageBitmap(new ImageData(imageDataArray,intendedWidth,intendedHeight))
            context.drawImage(tempBitmap,0,0,goalWidth,goalHeight)
        }
        eventLoops.push(draw)
    
    }
    return [options,wasmOptions]
}}