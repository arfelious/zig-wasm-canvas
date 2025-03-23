
let wanderer = {create:function(){
    let options = {}
options.onInstantiate = (canvasArr,state,eventLoops)=>{
    let canvas = canvasArr[0]
    let wasPlaying = false
    eventLoops.push((diff)=>{
        let ctx = canvas.getContext('2d')

        ctx.fillStyle=["black","white"][state.isPlaying?1:0]
        if(state.isPlaying||wasPlaying)ctx.fillRect(0,0,canvas.width,canvas.height)
        wasPlaying = state.isPlaying
    })
}
let toNum = (arr)=>arr[0]+arr[1]*256+arr[2]*256*256
let inputValues = {"iterationCount":10000,"intendedCount":1000,"intendedWidth":120,"intendedHeight":120,"goalWidth":360,"goalHeight":360,"color":toNum([0,0,255])}
let defaultvalues = {...inputValues}
let restartAnimation = ()=>{
    if(wasmCanvas.memory){
        wasmCanvas.memory.fill(0)
        context.clearRect(0,0,canvas.width,canvas.height)
    }
    if(typeof options.inputElements!==undefined){
        options.inputElements.forEach(([element,input])=>{
            console.log(input.type)
            if(input.type=="slider"){
                inputValues[input.id] = element.value
            }
            if(input.type=="text"){
                inputValues[input.id] = element.value
                if(input.id=="color"){
                    let val = element.value
                    if(element.value.length==4){
                        let c = element.value.slice(1)
                        val = "#"+c[0]+c[0]+c[1]+c[1]+c[2]+c[2]
                    }
                    if(val.length!=7||val[0]!="#"){
                        element.value = val= "#0000FF"
                    }
                    inputValues.color = toNum(val.slice(1).match(/.{2}/g).map(val=>parseInt(val,16)))
                }
            }
        })
    }
}
options.inputs=[{
    type:"slider",
    scale:"log",
    min:1,
    max:1e6,
    value:1e4,
    label:"Iteration Count",
    id:"iterationCount"
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
    value:"#0000FF",
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
            element.value = defaultvalues[input.id]
        })
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
    const imageData = context.createImageData(canvas.width, canvas.height);
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
        let colorNum = inputValues.color||defaultvalues.color
        instance.exports.iterate(intendedCount,iterationCount,intendedWidth,intendedHeight,colorNum)
        let imageDataArray = new Uint8ClampedArray(wasmMemoryArray.slice(bufferOffset, bufferOffset + intendedWidth * intendedHeight * 4));
        if(goalWidth==intendedHeight&&0){
            imageData.data.set(imageDataArray);
            context.putImageData(imageData, 0, 0);
        }else{
            let tempBitmap = await window.createImageBitmap(new ImageData(imageDataArray,intendedWidth,intendedHeight))
            context.drawImage(tempBitmap,0,0,goalWidth,goalHeight)


        }
    }
    eventLoops.push(draw)

}
return [options,wasmOptions]
}}