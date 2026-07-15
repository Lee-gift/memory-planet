import PlanetGallery from './components/PlanetGallery'

interface PhotoData {
  id: string
  url: string
}

const LOCAL_IMAGES: PhotoData[] = [
  { id: '1', url: '/picture_jin/_cgi-bin_mmwebwx-bin_webwxgetmsgimg__&MsgID=7587218944846055727&skey=@crypt_57a2213d_7c93d8d08ffc7160e9daf29160b37205&mmweb_appid=wx_webfilehelper.jpg' },
  { id: '2', url: '/picture_jin/_cgi-bin_mmwebwx-bin_webwxgetmsgimg__&MsgID=3027587409583169787&skey=@crypt_57a2213d_7c93d8d08ffc7160e9daf29160b37205&mmweb_appid=wx_webfilehelper.jpg' },
  { id: '3', url: '/picture_jin/_cgi-bin_mmwebwx-bin_webwxgetmsgimg__&MsgID=8333618859729185869&skey=@crypt_57a2213d_7c93d8d08ffc7160e9daf29160b37205&mmweb_appid=wx_webfilehelper.jpg' },
  { id: '4', url: '/picture_jin/_cgi-bin_mmwebwx-bin_webwxgetmsgimg__&MsgID=6805781947635957706&skey=@crypt_57a2213d_7c93d8d08ffc7160e9daf29160b37205&mmweb_appid=wx_webfilehelper.jpg' },
  { id: '5', url: '/picture_jin/_cgi-bin_mmwebwx-bin_webwxgetmsgimg__&MsgID=5359602901499597210&skey=@crypt_57a2213d_7c93d8d08ffc7160e9daf29160b37205&mmweb_appid=wx_webfilehelper.jpg' },
  { id: '6', url: '/picture_jin/_cgi-bin_mmwebwx-bin_webwxgetmsgimg__&MsgID=2945124377216206734&skey=@crypt_57a2213d_7c93d8d08ffc7160e9daf29160b37205&mmweb_appid=wx_webfilehelper.jpg' },
  { id: '7', url: '/picture_jin/_cgi-bin_mmwebwx-bin_webwxgetmsgimg__&MsgID=4250909916358121786&skey=@crypt_57a2213d_7c93d8d08ffc7160e9daf29160b37205&mmweb_appid=wx_webfilehelper.jpg' },
  { id: '8', url: '/picture_jin/_cgi-bin_mmwebwx-bin_webwxgetmsgimg__&MsgID=5829816997553631497&skey=@crypt_57a2213d_7c93d8d08ffc7160e9daf29160b37205&mmweb_appid=wx_webfilehelper.jpg' },
  { id: '9', url: '/picture_jin/_cgi-bin_mmwebwx-bin_webwxgetmsgimg__&MsgID=6281541903161529573&skey=@crypt_57a2213d_7c93d8d08ffc7160e9daf29160b37205&mmweb_appid=wx_webfilehelper.jpg' },
  { id: '10', url: '/picture_jin/_cgi-bin_mmwebwx-bin_webwxgetmsgimg__&MsgID=7476169183993477285&skey=@crypt_57a2213d_7c93d8d08ffc7160e9daf29160b37205&mmweb_appid=wx_webfilehelper.jpg' },
  { id: '11', url: '/picture_jin/_cgi-bin_mmwebwx-bin_webwxgetmsgimg__&MsgID=4495236921218116917&skey=@crypt_57a2213d_7c93d8d08ffc7160e9daf29160b37205&mmweb_appid=wx_webfilehelper.jpg' },
  { id: '12', url: '/picture_jin/_cgi-bin_mmwebwx-bin_webwxgetmsgimg__&MsgID=2367066841729713315&skey=@crypt_57a2213d_7c93d8d08ffc7160e9daf29160b37205&mmweb_appid=wx_webfilehelper.jpg' },
  { id: '13', url: '/picture_jin/_cgi-bin_mmwebwx-bin_webwxgetmsgimg__&MsgID=5742086422077696472&skey=@crypt_57a2213d_7c93d8d08ffc7160e9daf29160b37205&mmweb_appid=wx_webfilehelper.jpg' },
  { id: '14', url: '/picture_jin/_cgi-bin_mmwebwx-bin_webwxgetmsgimg__&MsgID=6948464185857499527&skey=@crypt_57a2213d_7c93d8d08ffc7160e9daf29160b37205&mmweb_appid=wx_webfilehelper.jpg' },
  { id: '15', url: '/picture_jin/_cgi-bin_mmwebwx-bin_webwxgetmsgimg__&MsgID=8418858920711157206&skey=@crypt_57a2213d_7c93d8d08ffc7160e9daf29160b37205&mmweb_appid=wx_webfilehelper.jpg' },
  { id: '16', url: '/picture_jin/_cgi-bin_mmwebwx-bin_webwxgetmsgimg__&MsgID=6041018410022142701&skey=@crypt_57a2213d_7c93d8d08ffc7160e9daf29160b37205&mmweb_appid=wx_webfilehelper.jpg' },
  { id: '17', url: '/picture_jin/_cgi-bin_mmwebwx-bin_webwxgetmsgimg__&MsgID=6410814198413538293&skey=@crypt_57a2213d_7c93d8d08ffc7160e9daf29160b37205&mmweb_appid=wx_webfilehelper.jpg' },
  { id: '18', url: '/picture_jin/_cgi-bin_mmwebwx-bin_webwxgetmsgimg__&MsgID=3703166663855243948&skey=@crypt_57a2213d_7c93d8d08ffc7160e9daf29160b37205&mmweb_appid=wx_webfilehelper.jpg' },
  { id: '19', url: '/picture_jin/_cgi-bin_mmwebwx-bin_webwxgetmsgimg__&MsgID=5095846997696794941&skey=@crypt_57a2213d_7c93d8d08ffc7160e9daf29160b37205&mmweb_appid=wx_webfilehelper.jpg' },
  { id: '20', url: '/picture_jin/_cgi-bin_mmwebwx-bin_webwxgetmsgimg__&MsgID=516094608650296492&skey=@crypt_57a2213d_7c93d8d08ffc7160e9daf29160b37205&mmweb_appid=wx_webfilehelper.jpg' },
]

function App() {
  return (
    <div className="min-h-screen bg-[#000105]">
      <PlanetGallery photos={LOCAL_IMAGES} />
    </div>
  )
}

export default App
