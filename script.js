$(document).ready(function () {
    //board
    let tileSize = 32;
    let rows = 19;
    let columns = 26;
    let board;
    let boardWidth = tileSize * columns;
    let boardHeight = tileSize * rows;
    let context;
    let score = 0;
    let gameOver = false;

    //defender
    let defenderWidth = tileSize * 2;
    let defenderHeight = tileSize;
    let defenderX = tileSize * columns / 2 - tileSize;
    let defenderY = tileSize * rows - tileSize * 2;
    let defender = {
        x: defenderX,
        y: defenderY,
        width: defenderWidth,
        height: defenderHeight
    }
    let defenderImg;
    let defenderVelocityX = tileSize; //defender moving speed
    let canShoot = true; // flag to track whether the defender can shoot

    //invaders
    let invaderArray = [];
    let invaderWidth = tileSize;
    let invaderHeight = tileSize;
    let invaderX = tileSize;
    let invaderY = tileSize;
    let invaderImg;
    let invaderRows = 5;
    let invaderColumns = 8;
    let invaderCount = 0;
    let invaderVelocityX = 1; //invader moving speed

    //bullets
    let bulletArray = [];
    let bulletVelocityY = -10; //bullet moving speed

    //invader bullets
    let invaderBulletArray = [];
    let invaderBulletVelocityY = 5; //bullet moving speed
    let invaderShootTimer = 0;
    const invaderShootInterval = 2000; //interval in milliseconds

    function movedefender(e) {
        if (gameOver) {
            return;
        }

        if (e.code == "ArrowLeft" && defender.x - defenderVelocityX >= 0) {
            defender.x -= defenderVelocityX; //move left
        }
        else if (e.code == "ArrowRight" && defender.x + defenderVelocityX + defender.width <= board.width) {
            defender.x += defenderVelocityX; //move right
        }
    }

    $(document).ready(function () {
        board = $("#board")[0];
        board.width = boardWidth;
        board.height = boardHeight;
        context = board.getContext("2d");

        // Load images for defender and invader
        defenderImg = new Image();
        defenderImg.src = "defender.png";
        $(defenderImg).on("load", function () {
            context.drawImage(defenderImg, defender.x, defender.y, defender.width, defender.height);
        });
        invaderImg = new Image();
        invaderImg.src = "invader.png";
        createInvaders();

        requestAnimationFrame(update);//start the game loop
        //event listeners for defender movement and shooting
        $(document).on("keydown", movedefender);
        $(document).on("keyup", shoot);
    });

    function createInvaders() {
        for (let c = 0; c < invaderColumns; c++) {
            for (let r = 0; r < invaderRows; r++) {
                let invader = {
                    img: invaderImg,
                    x: invaderX + c * invaderWidth * 1.5, //spacing between invaders
                    y: invaderY + r * invaderHeight * 1.5,
                    width: invaderWidth,
                    height: invaderHeight,
                    alive: true
                };
                invaderArray.push(invader);
            }

            //invader shooting
            $.each(invaderArray, function (i, invader) {
                if (invader.alive && Math.random() < 0.01) {
                    invaderShoot(invader);
                }
            });
        }
        invaderCount = invaderArray.length;
    }

    function invaderShoot(invader) {
        let invaderBullet = {
            x: invader.x + invader.width / 2,
            y: invader.y + invader.height,
            width: tileSize / 8,
            height: tileSize / 2,
            used: false
        }
        invaderBulletArray.push(invaderBullet);
    }

    // shooting by defender
    function shoot(e) {
        if (gameOver) {
            return;
        }

        if (e.code == "Space" && canShoot) {
            let bullet = {
                x: defender.x + defenderWidth * 15 / 32,
                y: defender.y,
                width: tileSize / 8,
                height: tileSize / 2,
                used: false
            }
            bulletArray.push(bullet);

            // update the flag to prevent shooting until the last bullet has left the board
            canShoot = false;
        }
    }

    // detect collision between two objects
    function detectCollision(a, b) {
        return a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y;
    }

    function updateInvaderBullets() {
        $.each(invaderBulletArray, function (i, invaderBullet) {
            invaderBullet.y += invaderBulletVelocityY;

            context.fillStyle = "red";
            context.fillRect(invaderBullet.x, invaderBullet.y, invaderBullet.width, invaderBullet.height);

            //check for collision with defender
            if (detectCollision(invaderBullet, defender)) {
                gameOver = true;
            }
        });

        // Remove bullets that have left the board
        while (invaderBulletArray.length > 0 && invaderBulletArray[0].y > boardHeight) {
            invaderBulletArray.shift();
        }

        // invader shooting
        $.each(invaderArray, function (i, invader) {
            if (invader.alive) {
                // Randomly shoot at regular intervals
                if (invaderShootTimer >= invaderShootInterval && Math.random() < 0.5) {
                    invaderShoot(invader);
                    invaderShootTimer = 0; // Reset the timer after shooting
                }
            }
        });
    }

    function update() {
        //game loop
        requestAnimationFrame(update);

        if (gameOver) {
            $("#gameOverMessage").css("display", "block");
            return;
        }

        context.clearRect(0, 0, board.width, board.height);

        //draw defender
        context.drawImage(defenderImg, defender.x, defender.y, defender.width, defender.height);

        //draw invader position
        $.each(invaderArray, function (i, invader) {
            if (invader.alive) {
                invader.x += invaderVelocityX;

                //if invader touches the borders, change direction and move down
                if (invader.x + invader.width >= board.width || invader.x <= 0) {
                    invaderVelocityX *= -1;
                    invader.x += invaderVelocityX * 2;

                    //move all invaders up by one row
                    $.each(invaderArray, function (j, inv) {
                        inv.y += invaderHeight;
                    });
                }
                context.drawImage(invaderImg, invader.x, invader.y, invader.width, invader.height);

                // Check if invader reaches the defender's position
                if (invader.y >= defender.y) {
                    gameOver = true;
                }
            }
        });

        // update bullets of defender
        $.each(bulletArray, function (i, bullet) {
            bullet.y += bulletVelocityY;
            context.fillStyle = "white";
            context.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);

            // check for bullet collision with invaders
            $.each(invaderArray, function (j, invader) {
                if (!bullet.used && invader.alive && detectCollision(bullet, invader)) {
                    bullet.used = true;
                    invader.alive = false;
                    invaderCount--;
                    score += 10;
                }
            });
        });

        // Check if the last bullet has left the board
        if (bulletArray.length === 0 || bulletArray[bulletArray.length - 1].y < 0) {
            canShoot = true;
        }

        //clear bullets
        while (bulletArray.length > 0 && (bulletArray[0].used || bulletArray[0].y < 0)) {
            bulletArray.shift(); //remove the first element of the array
        }

        //score
        context.fillStyle = "white";
        context.font = "16px courier";
        context.fillText(score, 5, 20);

        // update invader bullets and check for collisions with the defender
        updateInvaderBullets();

        // update the invader shooting timer
        invaderShootTimer += 16;

        // check if the shots of invaders touch the defender
        $.each(invaderBulletArray, function (i, invaderBullet) {
            if (detectCollision(invaderBullet, defender)) {
                gameOver = true;
                $("#gameOverMessage").css("display", "block");
                return false; // exit the loop since the game is already over
            }
        });

        // Check if all invaders are defeated
        if (invaderCount === 0) {
            // Recreate the invaders grid
            invaderArray = [];
            createInvaders();

            // Reset defender position
            defender.x = defenderX;

            // Reset shooting flag
            canShoot = true;
        }
    }

});