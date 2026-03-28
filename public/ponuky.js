/**
 * PONUKY – zoznam nehnuteľností na mape
 * ─────────────────────────────────────
 * Každá ponuka má tieto polia:
 *   lat   – zemepisná šírka  (desatinné číslo)
 *   lng   – zemepisná dĺžka  (desatinné číslo)
 *   type  – typ nehnuteľnosti: 'byt' | 'dom' | 'pozemok' | 'chata' | 'ostatne'
 *   title – názov, zobrazí sa ako nadpis v bublinom okne
 *   info  – krátky popis adresy / lokality
 *   url   – (voliteľné) odkaz na ponuku napr. na realitynb.sk
 *
 * Príklad pridania novej ponuky – skopíruj riadok a uprav hodnoty:
 *   { lat: 49.0000, lng: 19.0000, type: 'byt', title: 'Nový byt – Mesto', info: 'Ulica, Mesto' },
 */

const PONUKY = [
  { lat: 49.0717, lng: 19.2903, type: 'pozemok', title: 'Stavebný pozemok – Do Dielca',              info: 'Ulica Nad Dielcom, Ružomberok' },
  { lat: 49.0839, lng: 19.3086, type: 'ostatne', title: 'Obchodné priestory – Podhora',              info: 'Podhora 55, 034 01 Ružomberok · prenájom' },
  { lat: 49.0737, lng: 19.3361, type: 'chata',   title: 'Záhradná chatka – Štiavnička',             info: 'Záhradkárska osada, horný koniec obce Štiavnička' },
  { lat: 49.1174, lng: 19.1848, type: 'dom',     title: 'Rodinný dom – Hubová',                     info: 'Hlavná ulica (pri obecnom úrade), Hubová' },
  { lat: 49.1260, lng: 19.2820, type: 'pozemok', title: 'Investičný pozemok – Likavka',             info: 'Lokalita pod hradom Likava, severná časť obce Likavka' },
  { lat: 49.0670, lng: 19.3340, type: 'pozemok', title: 'Stavebný pozemok – Štiavnička',            info: 'Nová ulica smerom na Ludrovú, Štiavnička' },
  { lat: 49.1461, lng: 19.1716, type: 'dom',     title: 'Dom – Stankovany',                         info: 'Hlavná ulica, blízko železničnej zastávky, Stankovany' },
  { lat: 49.0523, lng: 19.3558, type: 'dom',     title: 'Bungalov – Liptovská Štiavnica',           info: 'Nová štvrť pod Chočom, Liptovská Štiavnica' },
  { lat: 49.0847, lng: 19.2679, type: 'dom',     title: 'Rodinný dom – Klačno (ID 399)',            info: 'Ulica Klačno, horná časť sídliska, Ružomberok' },
  { lat: 49.1455, lng: 19.5141, type: 'chata',   title: 'Rekreačná chata – Liptovská Sielnica',    info: 'Rekreačná zóna pri Liptovskej Mare (blízko Villa Betula)' },
  { lat: 49.0530, lng: 19.2930, type: 'ostatne', title: 'Výrobná hala – Biely Potok',              info: 'Ulica Hlavná, priemyselný areál pri vstupe do Bieleho Potoka' },
  { lat: 49.0710, lng: 18.9370, type: 'byt',     title: '4-izbový byt – Martin, Priekopa',         info: 'Priekopská ulica, Martin – Priekopa' },
  { lat: 49.0770, lng: 19.3220, type: 'byt',     title: '2-izbový byt – Bystrická cesta',          info: 'Bystrická cesta, Ružomberok (bytovky pri vstupe do mesta)' },
  { lat: 48.9411, lng: 19.3215, type: 'dom',     title: 'Rodinný dom – Liptovská Lúžna',           info: 'Stredná časť obce pri potoku, Liptovská Lúžna' },
  { lat: 49.0539, lng: 19.6179, type: 'byt',     title: '2-izbový byt – Iľanovo',                  info: 'Mestská časť Iľanovo, Liptovský Mikuláš' },
  { lat: 49.1408, lng: 19.2945, type: 'dom',     title: 'RD/objekt na podnikanie – Valaská Dubová (ID 317)', info: 'Valaská Dubová, priamo pri hlavnom ťahu E77' },
  { lat: 49.0466, lng: 19.3318, type: 'dom',     title: 'Rodinný dom – Ludrová (ID 316)',           info: 'Centrálna zóna Ludrovej (v blízkosti kostola)' },
  { lat: 49.0660, lng: 19.3260, type: 'pozemok', title: 'Pozemok – Ludrová',                        info: 'Nová stavebná zóna na začiatku obce (smerom od Ružomberka)' },
  { lat: 49.0494, lng: 19.6789, type: 'byt',     title: 'Investičný apartmán – Liptovský Ján',      info: 'Starojánska, Liptovský Ján, okres Liptovský Mikuláš' },
];
