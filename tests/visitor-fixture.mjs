// Semua isi di sini adalah data uji, tidak dikirim ke gereja.
export function visitorFixture(count = 12) {
  const date = new Date(Date.now() + 7 * 86400000).toISOString().slice(0,10);
  const record = {
    isoDate: date, dateLabel: 'Sabat, '+date, shortDate: date, time: '09:00',
    timestamp: date+'T09:00:00+08:00', status: 'next', countdown: 'MENDATANG',
    fields: [{label:'Petugas',value:'Petugas uji dengan nama yang panjang untuk menguji pembungkusan teks'}]
  };
  const sections = ['khotbah','sekolahSabat','doa','pemuda'].map(id => ({id,title:id === 'doa'?'Ibadah Rabu Malam':'Ibadah uji '+id,records:[{...record}]}));
  const long = 'Kebersamaan jemaat dalam pelayanan dengan judul panjang yang tetap perlu dibaca secara utuh';
  return {
    version:'test',cacheRevision:'test-1',dayKey:date,periodLabel:'Periode uji',updatedAt:date,copyright:'Data uji',
    site:{church_name:'GMAHK Galilea',tagline:'Bertumbuh dalam iman',hero_title:'Selamat datang di Galilea.',
      hero_description:'Temukan jadwal ibadah dan kabar jemaat. Kami senang menyambut Anda di Galilea.',
      address:'Alamat uji '+long,phone:'0000000000',whatsapp_url:'https://wa.me/0000000000',
      sabbath_service:'Sabat · 09.00 WITA',wednesday_service:'Rabu · 19.00 WITA',
      instagram_handle:'@advent.galilea',instagram_url:'https://www.instagram.com/advent.galilea/',
      bible_reference:'Referensi uji',bible_verse:'Teks uji',about_title:'Profil uji',about_text:'Profil untuk pengujian.'},
    sections,banners:[],worshipPlans:[],nextSabbath:{...record,services:sections.filter(section=>section.id!=='doa').map(section=>({title:section.title,fields:record.fields}))},
    nextWednesday:{...record,time:'19:00'},
    activities:Array.from({length:count},(_,i)=>({id:'news-'+i,title:i===0?'Kunjungan Uji':long+' '+i,
      description:'<p>'+long.repeat(3)+'</p>',dateLabel:date,location:long,coverUrl:i%2?'/assets/presentation/schedule.webp':'',photos:[],media:[],photoCount:0})),
    announcements:Array.from({length:count},(_,i)=>({id:'note-'+i,title:i===0?'Pengumuman Uji':long+' '+i,summary:long.repeat(4),dateLabel:date,priority:i%2?'PENTING':'NORMAL',category:'UMUM'})),
    gallery:Array.from({length:count},(_,i)=>({title:long+' '+i,caption:long.repeat(2),imageUrl:'/assets/presentation/bible.webp'})),
    leaders:[{name:long,role:'Pengurus uji',description:long,photoUrl:''}],
    faq:[{question:'Bagaimana melihat jadwal?',answer:'Buka menu Jadwal.',category:'Jadwal'}],system:{},themeSong:null
  };
}

export const hymnalFixture = Array.from({length:525},(_,i)=>({number:i+1,index:String(i+1).padStart(3,'0'),title:'Lagu uji '+(i+1),lyrics:[{type:'verse',index:1,lines:['Ayat uji pertama']},{type:'refrain',index:1,lines:['Reff uji']},{type:'verse',index:2,lines:['Ayat uji kedua']}]}));
