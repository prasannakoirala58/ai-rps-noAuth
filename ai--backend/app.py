# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import random

app = Flask(__name__)
CORS(app)

actions = ["rock", "paper", "scissors"]
action_index = {a: i for i, a in enumerate(actions)}

# Q‑learning hyperparameters
alpha = 0.2
gamma = 0.95
TRAINING_EXPLORATION = 0.5

# Initialize Q‑table (3×3) randomly so training varies
q_table = np.random.uniform(-0.1, 0.1, (3, 3))

# Training round state
training_moves_required = 10
training_moves_done = 0
training_scores = {"player": 0, "ai": 0, "draws": 0}

# Battle round state
battle_score_limit = 3
battle_scores = {"player": 0, "ai": 0, "draws": 0}


def pick_ai_move(user_move, mode="training"):
    """In training: epsilon‑greedy Q‑learning. In battle: uniform random."""
    if mode == "battle":
        return random.choice(actions)
    # training mode
    if random.random() < TRAINING_EXPLORATION:
        return random.choice(actions)
    # exploit Q‑table
    idx = action_index[user_move]
    return actions[np.argmax(q_table[idx])]


def compute_result(user, ai):
    if user == ai:
        return "draw"
    wins = {
        "rock": "scissors",
        "paper": "rock",
        "scissors": "paper"
    }
    return "win" if wins[user] == ai else "lose"


def update_q_table(user_move, ai_move, result):
    idx_u = action_index[user_move]
    idx_a = action_index[ai_move]
    if result == "win":
        reward = -1
    elif result == "lose":
        reward = 1
    else:
        reward = 0
    # Q‑learning update
    q_table[idx_u, idx_a] = (1 - alpha) * q_table[idx_u, idx_a] + alpha * (
        reward + gamma * np.max(q_table[idx_a])
    )


def random_message(res):
    if res == "win":
        return random.choice(["Wow—you crushed me!", "You’re unstoppable!"])
    if res == "lose":
        return random.choice(["I win this round!", "Better luck next time!"])
    return random.choice(["Great minds think alike!", "We tied!"])


@app.route("/train", methods=["POST"])
def train():
    global training_moves_done, training_scores

    data = request.json or {}
    user_move = data.get("move")
    if user_move not in actions:
        return jsonify({"error": "Invalid move"}), 400

    ai_move = pick_ai_move(user_move, mode="training")
    res = compute_result(user_move, ai_move)
    update_q_table(user_move, ai_move, res)

    # update training scoreboard
    if res == "win":
        training_scores["player"] += 1
    elif res == "lose":
        training_scores["ai"] += 1
    else:
        training_scores["draws"] += 1

    training_moves_done += 1
    training_complete = (training_moves_done >= training_moves_required)
    if training_complete:
        training_moves_done = 0

    return jsonify({
        "ai_move": ai_move,
        "result": res,
        "message": random_message(res),
        "training_complete": training_complete,
        "training_scores": training_scores
    })


@app.route("/battle", methods=["POST"])
def battle():
    global battle_scores

    data = request.json or {}
    user_move = data.get("move")
    if user_move not in actions:
        return jsonify({"error": "Invalid move"}), 400

    ai_move = pick_ai_move(user_move, mode="battle")
    res = compute_result(user_move, ai_move)

    # update battle scoreboard
    if res == "win":
        battle_scores["player"] += 1
    elif res == "lose":
        battle_scores["ai"] += 1
    else:
        battle_scores["draws"] += 1

    game_over = False
    winner = None
    final_scores = dict(battle_scores)
    if battle_scores["player"] >= battle_score_limit or battle_scores["ai"] >= battle_score_limit:
        game_over = True
        winner = "player" if battle_scores["player"] >= battle_score_limit else "ai"
        battle_scores = {"player": 0, "ai": 0, "draws": 0}

    return jsonify({
        "ai_move": ai_move,
        "result": res,
        "message": random_message(res),
        "battle_scores": battle_scores,
        "final_scores": final_scores,
        "game_over": game_over,
        "winner": winner
    })


if __name__ == "__main__":
    app.run(debug=True, port=5000)
