var hotKeys= {
    'punch': {
        'keyCode': 'KeyP',
        'text': '[P]'
    },
    'stab': {
        'keyCode': 'KeyB',
        'text': '[B]'
    },
    'swing': {
        'keyCode': 87,
        'text': '[W]'
    },
    'slash': {
        'keyCode': 72,
        'text': '[H]'
    },
    'slice': {
        'keyCode': 83,
        'text': '[S]'
    },
    'thrust': {
        'keyCode': 84,
        'text': '[T]'
    },
    'shoot': {
        'keyCode': 81,
        'text': '[Q]'
    },
    'blast': {
        'keyCode': 66,
        'text': '[B]'
    },
    'lob': {
        'keyCode': 76,
        'text': '[L]'
    },
    'tangle': {
        'keyCode': 71,
        'text': '[G]'
    },
    'disintegrate': {
        'keyCode': 73,
        'text': '[I]'
    },
    'dice': {
        'keyCode': 68,
        'text': '[D]'
    },
    'stun': {
        'keyCode': 90,
        'text': '[Z]'
    },
    'detonate': {
        'keyCode': 88,
        'text': '[X]'
    },
    'eat': {
        'keyCode': 'KeyE',
        'text': '[E]'
    },
    'meds': {
        'keyCode': 77,
        'text': '[M]'
    },
    'hypo': {
        'keyCode': 86,
        'text': '[V]'
    },
    'shield': {
        'keyCode': 70,
        'text': '[F]'
    },
    'boost': {
        'keyCode': 82,
        'text': '[R]'
    },
};

function bindHotKeys() {
    $('body').bind('keypress', function(e) {
        // Debug: Print keyCode
        // console.log(e.code);

        // Simulate Mouse Click on Buttons.
        if(e.key=='p' || e.key=='P'){
            // Punch.
            $("#attack_fists").trigger("click");
        }
        if(e.key=='b' || e.key=='B'){
            // Stab Bone Spear.
            $("#attack_bone-spear").trigger("click");
        }
        if(e.key=='w' || e.key=='W'){
            // Swing Iron Sword.
            $("#attack_iron-sword").trigger("click");
        }
        if(e.key=='h' || e.key=='H'){
            // Slash Steel Sword.
            $("#attack_steel-sword").trigger("click");
        }
        if(e.key=='s' || e.key=='S'){
            // Slice Katana
            $("#attack_katana").trigger("click");
        }
        if(e.key=='t' || e.key=='T'){
            // Thrust Bayonet.
            $("#attack_bayonet").trigger("click");
        }
        if(e.key=='q' || e.key=='Q'){
            // Shoot Rifle.
            $("#attack_rifle").trigger("click");
        }
        if(e.key=='b' || e.key=='B'){
            // Blast Laser Rifle.
            $("#attack_laser-rifle").trigger("click");
        }
        if(e.key=='l' || e.key=='L'){
            // Lob Grenade.
            $("#attack_grenade").trigger("click");
        }
        if(e.key=='g' || e.key=='G'){
            // Bolas Tangle.
            $("#attack_bolas").trigger("click");
        }
        if(e.key=='i' || e.key=='I'){
            // disintegrate Plasma Rifle
            $("#attack_plasma-rifle").trigger("click");
        }
        if(e.key=='d' || e.key=='D'){
            // Dice Energy Blade
            $("#attack_energy-blade").trigger("click");
        }
        if(e.key=='z' || e.key=='Z'){
            // Stun Disruptor
            $("#attack_disruptor").trigger("click");
        }
        if(e.key=='x' || e.key=='X'){
            // Detonate Handheld Nuke
            $("#attack_handheld-nuke").trigger("click");
        }
        if(e.key=='e' || e.key=='E'){
            // Eat Cured Meat.
            $("#eat").trigger("click");
        }
        if(e.key=='m' || e.key=='M'){
            // Use Medicine.
            $("#meds").trigger("click");
        }
        if(e.key=='v' || e.key=='V'){
            // Use Hypo.
            $("#hypo").trigger("click");
        }
        if(e.key=='f' || e.key=='F'){
            // Use Shield.
            $("#shield").trigger("click");
        }
        if(e.key=='      ' || e.key=='R'){
            // Boost Stim.
            $("#boost").trigger("click");
        }
    });
}