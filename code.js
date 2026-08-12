// --- Supabase設定 ---
const SUPABASE_URL = 'https://ditxmrgfntsndjsmaagg.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_XV855Fm-T69rS-8WAUWVTw_96ZJI6A7'
const SCHEMA_NAME = 'survival' // 指定のスキーマ名
const TABLE_NAME = 'survival'   // 指定のテーブル名

// クライアント初期化
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    db: { schema: SCHEMA_NAME }
})

document.addEventListener('DOMContentLoaded', () => {
    const submitBtn = document.getElementById('submit-btn')
    const menuSelect = document.getElementById('menu')
    const gotoMenu = document.getElementById('goto-menu')

    load()

    submitBtn.addEventListener('click', submit)
    menuSelect.addEventListener('change', e => movePage(e.target.value))
    gotoMenu.addEventListener('click', async () => await movePage('menu'))
})

function errMsg(err){
    console.dir(err)
    alert(err.message || 'エラーが発生しました。')
}

async function load(){
    const nameList = await getNameList()
    const nameFragment = document.createDocumentFragment()
    nameList.forEach(name => {
        const newOption = document.createElement('option')
        newOption.textContent = name
        nameFragment.appendChild(newOption)
    });

    const nameSelect = document.getElementById('name-select')
    nameSelect.appendChild(nameFragment)
}

function userDisturb(action){
    const nameSelect = document.getElementById('name-select')
    const submitBtn = document.getElementById('submit-btn')

    switch(action){
        case 'start':
            submitBtn.disabled = true
            nameSelect.disabled = true
            break;
        case 'end':
            submitBtn.disabled = false
            nameSelect.disabled = false
            break;
    }
}

async function movePage(action){
    const form = document.getElementById('form')
    const footer = document.getElementById('footer')
    const menu = document.getElementById('menu')
    const read = document.getElementById('read')
    const loading = document.getElementById('loading')

    if(action === 'form'){
        form.classList.remove('hidden')
        footer.classList.remove('hidden')
        menu.classList.add('hidden')
        
    } else if (action === 'read'){
        menu.classList.add('hidden')
        loading.classList.remove('hidden')
        await readLoad()
        loading.classList.add('hidden')
        read.classList.remove('hidden')
        footer.classList.remove('hidden')
    }
    else if (action === 'menu'){
        form.classList.add('hidden')
        footer.classList.add('hidden')
        read.classList.add('hidden')
        menu.classList.remove('hidden')
    }
}

async function getposition(){
    const geo = navigator.geolocation
    return new Promise((resolve) => {
        geo.getCurrentPosition(positionSuccess, positionError, { timeout: 5000 })

        async function positionSuccess(pos){
            const latitude = pos.coords.latitude
            const longitude = pos.coords.longitude
            const accuracy = pos.coords.accuracy
            const positionData = {
                latitude: latitude,
                longitude: longitude,
                accuracy: accuracy,
            }
            try{
                const response = await fetch(`https://geoapi.heartrails.com/api/json?method=searchByGeoLocation&x=${longitude}&y=${latitude}`, { method: 'GET' })
                
                if(response.ok){
                    const addressObj = await response.json()
                    const nearest = addressObj.response.location[0]
                    const address = nearest.prefecture + nearest.city + nearest.town
                    positionData.address = address
                }
            } catch(e){
                console.log('住所取得失敗：', e)
            }
            
            resolve(positionData)
        }

        function positionError(err){
            console.log(err.message)
            resolve(null)
        }
    })
}

// 名前リスト取得
async function getNameList(){
    try{
        const { data, error } = await supabaseClient
            .schema('survival')
            .from('name_list')
            .select('name')
            .order('name', { ascending: true })

        if (error) throw error

        const nameList = [...new Set(data.map(row => row.name))]
        return nameList
    } catch(e){
        errMsg(e)
        return []
    }
}

// データ送信
async function submit(){
    userDisturb('start')
    try{

        const name = document.getElementById('name-select').value
        const position = await getposition()

        const { error } = await supabaseClient
            .schema('survival')
            .from(TABLE_NAME)
            .insert([{
                name: name,
                latitude: position?.latitude ?? null,
                longitude: position?.longitude ?? null,
                accuracy: position?.accuracy ?? null,
                address: position?.address ?? null
            }])

        if (error) throw error

        alert('送信しました。')
    } catch(e){
        errMsg(e)
    } finally{
        userDisturb('end')
    }
}

// データ読み込み
async function readLoad(){
    userDisturb('start')
    try {

        const { data, error } = await supabaseClient
            .schema('survival')
            .from(TABLE_NAME)
            .select('created_at, name, latitude, longitude, accuracy, address')
            .order('created_at', { ascending: false })
            .limit(100)

        if (error) throw error

        const fragment = document.createDocumentFragment()
        data.forEach(row => {
            const newTr = document.createElement('tr')
            Object.values(row).forEach(val => {
                const newTd = document.createElement('td')
                newTd.textContent = val ?? ''
                newTr.appendChild(newTd)
            })
            fragment.appendChild(newTr)
        })

        const tbody = document.getElementById('tbody')
        tbody.innerHTML = ''
        tbody.appendChild(fragment)
    } catch(e) {
        errMsg(e)
    } finally {
        userDisturb('end')
    }
}