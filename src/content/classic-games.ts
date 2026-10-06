/** Ten curated historical games. Complete, unannotated scores from PGN Mentor.
 * Retrieved 2026-10-06; sourceUrl links to the individual game's history.
 * Keep the source scores intact, including their recorded endings: do not append
 * post-game analysis (notably Steinitz–von Bardeleben's demonstrated mate).
 */
export interface ClassicGame {
  id: string;
  title: string;
  white: string;
  black: string;
  event: string;
  location: string;
  year: number;
  result: "1-0" | "0-1" | "1/2-1/2";
  sourceUrl: string;
  scoreSourceUrl: string;
  pgn: string;
  photo: {
    src: string;
    caption: string;
    alt: string;
    sourceUrl: string;
    credit: string;
    license: string;
    licenseUrl: string;
    width: number;
    height: number;
  };
}

export const CLASSIC_GAMES: readonly ClassicGame[] = [
  {
    "id": "evergreen-1852",
    "title": "The Evergreen Game",
    "white": "Adolf Anderssen",
    "black": "Jean Dufresne",
    "event": "Casual game",
    "location": "Berlin",
    "year": 1852,
    "result": "1-0",
    "sourceUrl": "https://en.wikipedia.org/wiki/Evergreen_Game",
    "scoreSourceUrl": "https://www.pgnmentor.com/players/Anderssen.zip",
    "pgn": "[Event \"Berlin 'Evergreen'\"]\n[Site \"Berlin\"]\n[Date \"1852.??.??\"]\n[Round \"?\"]\n[White \"Anderssen, Adolf\"]\n[Black \"Dufresne, Jean\"]\n[Result \"1-0\"]\n[WhiteElo \"\"]\n[BlackElo \"\"]\n[ECO \"C52\"]\n\n1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5 4.b4 Bxb4 5.c3 Ba5 6.d4 exd4 7.O-O d3 8.Qb3 Qf6\n9.e5 Qg6 10.Re1 Nge7 11.Ba3 b5 12.Qxb5 Rb8 13.Qa4 Bb6 14.Nbd2 Bb7 15.Ne4 Qf5\n16.Bxd3 Qh5 17.Nf6+ gxf6 18.exf6 Rg8 19.Rad1 Qxf3 20.Rxe7+ Nxe7 21.Qxd7+ Kxd7\n22.Bf5+ Ke8 23.Bd7+ Kf8 24.Bxe7+  1-0",
    "photo": {
      "src": "/images/classics/anderssen.jpg",
      "caption": "Adolf Anderssen · portrait",
      "alt": "Adolf Anderssen in an archival portrait",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Anderssen,_Adolf_%22-5%22_-_DPLA_-_9ca464339f18b3d8be87fccc68c3ee73_(cropped).jpg",
      "credit": "Creator unrecorded / Cleveland Public Library",
      "license": "Public domain",
      "licenseUrl": "https://creativecommons.org/publicdomain/mark/1.0/",
      "width": 600,
      "height": 653
    }
  },
  {
    "id": "opera-1858",
    "title": "The Opera Game",
    "white": "Paul Morphy",
    "black": "Duke Karl & Count Isouard",
    "event": "Consultation game",
    "location": "Paris",
    "year": 1858,
    "result": "1-0",
    "sourceUrl": "https://en.wikipedia.org/wiki/Opera_Game",
    "scoreSourceUrl": "https://www.pgnmentor.com/players/Morphy.zip",
    "pgn": "[Event \"Paris it\"]\n[Site \"Paris\"]\n[Date \"1858.??.??\"]\n[Round \"?\"]\n[White \"Morphy, Paul \"]\n[Black \"Duke Karl Count Isouard\"]\n[Result \"1-0\"]\n[WhiteElo \"\"]\n[BlackElo \"\"]\n[ECO \"C41\"]\n\n1.e4 e5 2.Nf3 d6 3.d4 Bg4 4.dxe5 Bxf3 5.Qxf3 dxe5 6.Bc4 Nf6 7.Qb3 Qe7 8.Nc3 c6\n9.Bg5 b5 10.Nxb5 cxb5 11.Bxb5+ Nbd7 12.O-O-O Rd8 13.Rxd7 Rxd7 14.Rd1 Qe6\n15.Bxd7+ Nxd7 16.Qb8+ Nxb8 17.Rd8+  1-0",
    "photo": {
      "src": "/images/classics/morphy.jpg",
      "caption": "Paul Morphy · 1859 portrait",
      "alt": "Archival photograph of Paul Morphy in 1859",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:PaulCharlesMorphy.jpg",
      "credit": "Unknown photographer / Cleveland Public Library",
      "license": "Public domain",
      "licenseUrl": "https://creativecommons.org/publicdomain/mark/1.0/",
      "width": 600,
      "height": 677
    }
  },
  {
    "id": "steinitz-bardeleben-1895",
    "title": "The Battle of Hastings",
    "white": "Wilhelm Steinitz",
    "black": "Curt von Bardeleben",
    "event": "Hastings tournament",
    "location": "Hastings",
    "year": 1895,
    "result": "1-0",
    "sourceUrl": "https://www.chesshistory.com/winter/extra/steinitzvonbardeleben.html",
    "scoreSourceUrl": "https://www.pgnmentor.com/players/Steinitz.zip",
    "pgn": "[Event \"Hastings\"]\n[Site \"Hastings\"]\n[Date \"1895.??.??\"]\n[Round \"?\"]\n[White \"Steinitz, William\"]\n[Black \"Von Bardeleben, Curt\"]\n[Result \"1-0\"]\n[WhiteElo \"\"]\n[BlackElo \"\"]\n[ECO \"C54\"]\n\n1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5 4.c3 Nf6 5.d4 exd4 6.cxd4 Bb4+ 7.Nc3 d5 8.exd5 Nxd5\n9.O-O Be6 10.Bg5 Be7 11.Bxd5 Bxd5 12.Nxd5 Qxd5 13.Bxe7 Nxe7 14.Re1 f6 15.Qe2 Qd7\n16.Rac1 c6 17.d5 cxd5 18.Nd4 Kf7 19.Ne6 Rhc8 20.Qg4 g6 21.Ng5+ Ke8 22.Rxe7+ Kf8\n23.Rf7+ Kg8 24.Rg7+ Kh8 25.Rxh7+  1-0",
    "photo": {
      "src": "/images/classics/steinitz.jpg",
      "caption": "Wilhelm Steinitz · portrait",
      "alt": "Archival portrait of Wilhelm Steinitz",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Steinitz,_William-4_-_DPLA_-_9eeab9ac335135c24b69ab7e36fc5354_(cropped).jpg",
      "credit": "Fritz Schumann / Cleveland Public Library",
      "license": "Public domain",
      "licenseUrl": "https://creativecommons.org/publicdomain/mark/1.0/",
      "width": 600,
      "height": 722
    }
  },
  {
    "id": "rubinstein-1907",
    "title": "Rubinstein’s Immortal",
    "white": "Georg Rotlewi",
    "black": "Akiba Rubinstein",
    "event": "Łódź tournament",
    "location": "Łódź",
    "year": 1907,
    "result": "0-1",
    "sourceUrl": "https://en.wikipedia.org/wiki/Rotlewi_versus_Rubinstein",
    "scoreSourceUrl": "https://www.pgnmentor.com/players/Rubinstein.zip",
    "pgn": "[Event \"Lodz1\"]\n[Site \"Lodz\"]\n[Date \"1907.??.??\"]\n[Round \"?\"]\n[White \"Rotlewi, Georg A\"]\n[Black \"Rubinstein, Akiba\"]\n[Result \"0-1\"]\n[WhiteElo \"\"]\n[BlackElo \"\"]\n[ECO \"D40\"]\n\n1.d4 d5 2.Nf3 e6 3.e3 c5 4.c4 Nc6 5.Nc3 Nf6 6.dxc5 Bxc5 7.a3 a6 8.b4 Bd6\n9.Bb2 O-O 10.Qd2 Qe7 11.Bd3 dxc4 12.Bxc4 b5 13.Bd3 Rd8 14.Qe2 Bb7 15.O-O Ne5\n16.Nxe5 Bxe5 17.f4 Bc7 18.e4 Rac8 19.e5 Bb6+ 20.Kh1 Ng4 21.Be4 Qh4 22.g3 Rxc3\n23.gxh4 Rd2 24.Qxd2 Bxe4+ 25.Qg2 Rh3  0-1",
    "photo": {
      "src": "/images/classics/rubinstein.jpg",
      "caption": "Akiba Rubinstein · c. 1907–08",
      "alt": "Archival photograph of Akiba Rubinstein around 1907 or 1908",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Akiba-RubinsteinC.jpg",
      "credit": "Unknown photographer",
      "license": "Public domain",
      "licenseUrl": "https://creativecommons.org/publicdomain/mark/1.0/",
      "width": 600,
      "height": 807
    }
  },
  {
    "id": "gold-coin-1912",
    "title": "The Gold Coin Game",
    "white": "Stepan Levitsky",
    "black": "Frank Marshall",
    "event": "German Chess Congress",
    "location": "Breslau",
    "year": 1912,
    "result": "0-1",
    "sourceUrl": "https://en.wikipedia.org/wiki/Levitsky_versus_Marshall",
    "scoreSourceUrl": "https://www.pgnmentor.com/players/Marshall.zip",
    "pgn": "[Event \"DSB-18.Kongress\"]\n[Site \"Breslau\"]\n[Date \"1912.??.??\"]\n[Round \"6\"]\n[White \"Levitsky, Stepan M\"]\n[Black \"Marshall, Frank James\"]\n[Result \"0-1\"]\n[WhiteElo \"\"]\n[BlackElo \"\"]\n[ECO \"B40\"]\n\n1.e4 e6 2.d4 d5 3.Nc3 c5 4.Nf3 Nc6 5.exd5 exd5 6.Be2 Nf6 7.O-O Be7 8.Bg5 O-O\n9.dxc5 Be6 10.Nd4 Bxc5 11.Nxe6 fxe6 12.Bg4 Qd6 13.Bh3 Rae8 14.Qd2 Bb4 15.Bxf6 Rxf6\n16.Rad1 Qc5 17.Qe2 Bxc3 18.bxc3 Qxc3 19.Rxd5 Nd4 20.Qh5 Ref8 21.Re5 Rh6 22.Qg5 Rxh3\n23.Rc5 Qg3  0-1",
    "photo": {
      "src": "/images/classics/marshall.jpg",
      "caption": "Frank Marshall · 1904 portrait",
      "alt": "Frank Marshall in a portrait published in Chess Openings, 1904",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Frank_Marshall_1904.jpg",
      "credit": "Unknown photographer / Chess Openings (1904)",
      "license": "Public domain",
      "licenseUrl": "https://creativecommons.org/publicdomain/mark/1.0/",
      "width": 600,
      "height": 885
    }
  },
  {
    "id": "century-1956",
    "title": "The Game of the Century",
    "white": "Donald Byrne",
    "black": "Bobby Fischer",
    "event": "Rosenwald Memorial",
    "location": "New York",
    "year": 1956,
    "result": "0-1",
    "sourceUrl": "https://en.wikipedia.org/wiki/Game_of_the_Century_(chess)",
    "scoreSourceUrl": "https://www.pgnmentor.com/players/Fischer.zip",
    "pgn": "[Event \"New York Rosenwald\"]\n[Site \"New York\"]\n[Date \"1956.??.??\"]\n[Round \"?\"]\n[White \"Byrne, Donald\"]\n[Black \"Fischer, Robert James\"]\n[Result \"0-1\"]\n[WhiteElo \"\"]\n[BlackElo \"\"]\n[ECO \"D97\"]\n\n1.Nf3 Nf6 2.c4 g6 3.Nc3 Bg7 4.d4 O-O 5.Bf4 d5 6.Qb3 dxc4 7.Qxc4 c6 8.e4 Nbd7\n9.Rd1 Nb6 10.Qc5 Bg4 11.Bg5 Na4 12.Qa3 Nxc3 13.bxc3 Nxe4 14.Bxe7 Qb6 15.Bc4 Nxc3\n16.Bc5 Rfe8+ 17.Kf1 Be6 18.Bxb6 Bxc4+ 19.Kg1 Ne2+ 20.Kf1 Nxd4+ 21.Kg1 Ne2+\n22.Kf1 Nc3+ 23.Kg1 axb6 24.Qb4 Ra4 25.Qxb6 Nxd1 26.h3 Rxa2 27.Kh2 Nxf2 28.Re1 Rxe1\n29.Qd8+ Bf8 30.Nxe1 Bd5 31.Nf3 Ne4 32.Qb8 b5 33.h4 h5 34.Ne5 Kg7 35.Kg1 Bc5+\n36.Kf1 Ng3+ 37.Ke1 Bb4+ 38.Kd1 Bb3+ 39.Kc1 Ne2+ 40.Kb1 Nc3+ 41.Kc1 Rc2+  0-1",
    "photo": {
      "src": "/images/classics/fischer.jpg",
      "caption": "Bobby Fischer · 1972 portrait",
      "alt": "Bobby Fischer photographed in 1972",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Bobby_Fischer_1972.jpg",
      "credit": "Bert Verhoeff / Anefo, Dutch National Archives",
      "license": "CC0",
      "licenseUrl": "http://creativecommons.org/publicdomain/zero/1.0/deed.en",
      "width": 600,
      "height": 818
    }
  },
  {
    "id": "botvinnik-tal-1960",
    "title": "Tal’s daring sacrifice",
    "white": "Mikhail Botvinnik",
    "black": "Mikhail Tal",
    "event": "World Championship · Game 6",
    "location": "Moscow",
    "year": 1960,
    "result": "0-1",
    "sourceUrl": "https://en.wikipedia.org/wiki/World_Chess_Championship_1960",
    "scoreSourceUrl": "https://www.pgnmentor.com/players/Tal.zip",
    "pgn": "[Event \"World Championship 23th\"]\n[Site \"Moscow\"]\n[Date \"1960.??.??\"]\n[Round \"6\"]\n[White \"Botvinnik, Mikhail\"]\n[Black \"Tal, Mihail\"]\n[Result \"0-1\"]\n[WhiteElo \"\"]\n[BlackElo \"\"]\n[ECO \"E69\"]\n\n1.c4 Nf6 2.Nf3 g6 3.g3 Bg7 4.Bg2 O-O 5.d4 d6 6.Nc3 Nbd7 7.O-O e5 8.e4 c6\n9.h3 Qb6 10.d5 cxd5 11.cxd5 Nc5 12.Ne1 Bd7 13.Nd3 Nxd3 14.Qxd3 Rfc8 15.Rb1 Nh5\n16.Be3 Qb4 17.Qe2 Rc4 18.Rfc1 Rac8 19.Kh2 f5 20.exf5 Bxf5 21.Ra1 Nf4 22.gxf4 exf4\n23.Bd2 Qxb2 24.Rab1 f3 25.Rxb2 fxe2 26.Rb3 Rd4 27.Be1 Be5+ 28.Kg1 Bf4 29.Nxe2 Rxc1\n30.Nxd4 Rxe1+ 31.Bf1 Be4 32.Ne2 Be5 33.f4 Bf6 34.Rxb7 Bxd5 35.Rc7 Bxa2 36.Rxa7 Bc4\n37.Ra8+ Kf7 38.Ra7+ Ke6 39.Ra3 d5 40.Kf2 Bh4+ 41.Kg2 Kd6 42.Ng3 Bxg3 43.Bxc4 dxc4\n44.Kxg3 Kd5 45.Ra7 c3 46.Rc7 Kd4  0-1",
    "photo": {
      "src": "/images/classics/tal-botvinnik.jpg",
      "caption": "1960 match · game 4",
      "alt": "Mikhail Botvinnik and Mikhail Tal at their 1960 World Championship, game 4",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Botvinnik_and_Tal_22_March_1960.jpg",
      "credit": "A. Batanov / Main Archive of Moscow",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0",
      "width": 600,
      "height": 404
    }
  },
  {
    "id": "fischer-spassky-1972",
    "title": "Fischer’s masterpiece",
    "white": "Bobby Fischer",
    "black": "Boris Spassky",
    "event": "World Championship · Game 6",
    "location": "Reykjavík",
    "year": 1972,
    "result": "1-0",
    "sourceUrl": "https://en.chessbase.com/post/50-years-ago-today-fischer-spassky-game-six",
    "scoreSourceUrl": "https://www.pgnmentor.com/players/Fischer.zip",
    "pgn": "[Event \"World Championship 28th\"]\n[Site \"Reykjavik\"]\n[Date \"1972.??.??\"]\n[Round \"6\"]\n[White \"Fischer, Robert James\"]\n[Black \"Spassky, Boris V\"]\n[Result \"1-0\"]\n[WhiteElo \"2785\"]\n[BlackElo \"2660\"]\n[ECO \"D59\"]\n\n1.c4 e6 2.Nf3 d5 3.d4 Nf6 4.Nc3 Be7 5.Bg5 O-O 6.e3 h6 7.Bh4 b6 8.cxd5 Nxd5\n9.Bxe7 Qxe7 10.Nxd5 exd5 11.Rc1 Be6 12.Qa4 c5 13.Qa3 Rc8 14.Bb5 a6 15.dxc5 bxc5\n16.O-O Ra7 17.Be2 Nd7 18.Nd4 Qf8 19.Nxe6 fxe6 20.e4 d4 21.f4 Qe7 22.e5 Rb8\n23.Bc4 Kh8 24.Qh3 Nf8 25.b3 a5 26.f5 exf5 27.Rxf5 Nh7 28.Rcf1 Qd8 29.Qg3 Re7\n30.h4 Rbb7 31.e6 Rbc7 32.Qe5 Qe8 33.a4 Qd8 34.R1f2 Qe8 35.R2f3 Qd8 36.Bd3 Qe8\n37.Qe4 Nf6 38.Rxf6 gxf6 39.Rxf6 Kg8 40.Bc4 Kh8 41.Qf4  1-0",
    "photo": {
      "src": "/images/classics/fischer.jpg",
      "caption": "Bobby Fischer · 1972 portrait",
      "alt": "Bobby Fischer photographed in 1972",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Bobby_Fischer_1972.jpg",
      "credit": "Bert Verhoeff / Anefo, Dutch National Archives",
      "license": "CC0",
      "licenseUrl": "http://creativecommons.org/publicdomain/zero/1.0/deed.en",
      "width": 600,
      "height": 818
    }
  },
  {
    "id": "karpov-kasparov-1985",
    "title": "The Octopus Knight",
    "white": "Anatoly Karpov",
    "black": "Garry Kasparov",
    "event": "World Championship · Game 16",
    "location": "Moscow",
    "year": 1985,
    "result": "0-1",
    "sourceUrl": "https://en.wikipedia.org/wiki/World_Chess_Championship_1985",
    "scoreSourceUrl": "https://www.pgnmentor.com/players/Kasparov.zip",
    "pgn": "[Event \"World Championship 32th-KK2\"]\n[Site \"Moscow\"]\n[Date \"1985.??.??\"]\n[Round \"16\"]\n[White \"Karpov, Anatoly\"]\n[Black \"Kasparov, Gary\"]\n[Result \"0-1\"]\n[WhiteElo \"2720\"]\n[BlackElo \"2700\"]\n[ECO \"B44\"]\n\n1.e4 c5 2.Nf3 e6 3.d4 cxd4 4.Nxd4 Nc6 5.Nb5 d6 6.c4 Nf6 7.N1c3 a6 8.Na3 d5\n9.cxd5 exd5 10.exd5 Nb4 11.Be2 Bc5 12.O-O O-O 13.Bf3 Bf5 14.Bg5 Re8 15.Qd2 b5\n16.Rad1 Nd3 17.Nab1 h6 18.Bh4 b4 19.Na4 Bd6 20.Bg3 Rc8 21.b3 g5 22.Bxd6 Qxd6\n23.g3 Nd7 24.Bg2 Qf6 25.a3 a5 26.axb4 axb4 27.Qa2 Bg6 28.d6 g4 29.Qd2 Kg7\n30.f3 Qxd6 31.fxg4 Qd4+ 32.Kh1 Nf6 33.Rf4 Ne4 34.Qxd3 Nf2+ 35.Rxf2 Bxd3 36.Rfd2 Qe3\n37.Rxd3 Rc1 38.Nb2 Qf2 39.Nd2 Rxd1+ 40.Nxd1 Re1+  0-1",
    "photo": {
      "src": "/images/classics/karpov-kasparov.jpg",
      "caption": "The 1985 world title match",
      "alt": "Garry Kasparov and Anatoly Karpov at the 1985 World Chess Championship",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Kasparov-12.jpg",
      "credit": "S.M.S.I., Inc. / Owen Williams, The Kasparov Agency",
      "license": "CC BY-SA 3.0",
      "licenseUrl": "http://creativecommons.org/licenses/by-sa/3.0/",
      "width": 600,
      "height": 410
    }
  },
  {
    "id": "kasparov-topalov-1999",
    "title": "Kasparov’s Immortal",
    "white": "Garry Kasparov",
    "black": "Veselin Topalov",
    "event": "Hoogovens · Round 4",
    "location": "Wijk aan Zee",
    "year": 1999,
    "result": "1-0",
    "sourceUrl": "https://en.wikipedia.org/wiki/Kasparov's_Immortal",
    "scoreSourceUrl": "https://www.pgnmentor.com/players/Kasparov.zip",
    "pgn": "[Event \"Hoogovens\"]\n[Site \"Wijk aan Zee\"]\n[Date \"1999.01.20\"]\n[Round \"4\"]\n[White \"Kasparov, Gary\"]\n[Black \"Topalov, Veselin\"]\n[Result \"1-0\"]\n[WhiteElo \"2812\"]\n[BlackElo \"2700\"]\n[ECO \"B07\"]\n\n1.e4 d6 2.d4 Nf6 3.Nc3 g6 4.Be3 Bg7 5.Qd2 c6 6.f3 b5 7.Nge2 Nbd7 8.Bh6 Bxh6\n9.Qxh6 Bb7 10.a3 e5 11.O-O-O Qe7 12.Kb1 a6 13.Nc1 O-O-O 14.Nb3 exd4 15.Rxd4 c5\n16.Rd1 Nb6 17.g3 Kb8 18.Na5 Ba8 19.Bh3 d5 20.Qf4+ Ka7 21.Rhe1 d4 22.Nd5 Nbxd5\n23.exd5 Qd6 24.Rxd4 cxd4 25.Re7+ Kb6 26.Qxd4+ Kxa5 27.b4+ Ka4 28.Qc3 Qxd5\n29.Ra7 Bb7 30.Rxb7 Qc4 31.Qxf6 Kxa3 32.Qxa6+ Kxb4 33.c3+ Kxc3 34.Qa1+ Kd2\n35.Qb2+ Kd1 36.Bf1 Rd2 37.Rd7 Rxd7 38.Bxc4 bxc4 39.Qxh8 Rd3 40.Qa8 c3 41.Qa4+ Ke1\n42.f4 f5 43.Kc1 Rd2 44.Qa7  1-0",
    "photo": {
      "src": "/images/classics/kasparov.jpg",
      "caption": "Kasparov · Frankfurt, 1999",
      "alt": "Garry Kasparov at the Frankfurt Chess Classics in July 1999",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Kasparow001.jpg",
      "credit": "dontworry / Wikimedia Commons",
      "license": "CC BY-SA 3.0",
      "licenseUrl": "http://creativecommons.org/licenses/by-sa/3.0/",
      "width": 600,
      "height": 407
    }
  }
];
