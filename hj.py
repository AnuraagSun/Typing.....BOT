import random
import string
import time
import threading
import tkinter as tk
from tkinter import ttk
import pyautogui

class RandomTyperBot:
    def __init__(self):
        # Initialize variables
        self.is_typing = False
        self.chars_typed = 0
        self.typing_thread = None
        self.pause_min = 100  # ms
        self.pause_max = 300  # ms
        self.long_pause_min = 1  # seconds
        self.long_pause_max = 5  # seconds
        self.long_pause_chance = 0.15  # 15% chance of a long pause
        
        # Create the GUI
        self.create_gui()
    
    def create_gui(self):
        """Create the Tkinter GUI"""
        self.root = tk.Tk()
        self.root.title("Random Typing Bot")
        self.root.geometry("300x200")
        self.root.resizable(False, False)
        
        # Configure styles
        style = ttk.Style()
        style.configure('TButton', font=('Arial', 10))
        style.configure('TFrame', background='#f0f0f0')
        style.configure('TLabel', background='#f0f0f0', font=('Arial', 10))
        
        # Main frame
        main_frame = ttk.Frame(self.root, padding=10)
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        # Status label
        self.status_var = tk.StringVar()
        self.status_var.set("Ready - Click Start then click in a text box")
        status_label = ttk.Label(main_frame, textvariable=self.status_var, wraplength=280)
        status_label.pack(pady=10)
        
        # Character count label
        self.count_var = tk.StringVar()
        self.count_var.set("Characters typed: 0")
        count_label = ttk.Label(main_frame, textvariable=self.count_var)
        count_label.pack(pady=5)
        
        # Buttons frame
        button_frame = ttk.Frame(main_frame)
        button_frame.pack(pady=10)
        
        # Start button
        self.start_button = ttk.Button(
            button_frame, 
            text="✅ Start", 
            command=self.start_typing,
            width=10
        )
        self.start_button.grid(row=0, column=0, padx=5)
        
        # Stop button
        self.stop_button = ttk.Button(
            button_frame, 
            text="⛔ Stop", 
            command=self.stop_typing,
            width=10,
            state=tk.DISABLED
        )
        self.stop_button.grid(row=0, column=1, padx=5)
        
        # Delete button
        self.delete_button = ttk.Button(
            button_frame, 
            text="🧹 Delete", 
            command=self.delete_typed,
            width=10,
            state=tk.DISABLED
        )
        self.delete_button.grid(row=0, column=2, padx=5)
        
        # Handle window close
        self.root.protocol("WM_DELETE_WINDOW", self.on_close)
        
    def start_typing(self):
        """Start the typing process"""
        if self.is_typing:
            return
            
        self.is_typing = True
        self.status_var.set("Waiting... Click in a text box")
        
        # Update button states
        self.start_button.config(state=tk.DISABLED)
        self.stop_button.config(state=tk.NORMAL)
        self.delete_button.config(state=tk.DISABLED)
        
        # Start typing in a separate thread
        self.typing_thread = threading.Thread(target=self.typing_loop)
        self.typing_thread.daemon = True
        self.typing_thread.start()
        
    def typing_loop(self):
        """Main typing loop that runs in a separate thread"""
        # Give user time to click in a text field
        time.sleep(1)
        
        self.status_var.set("Typing...")
        self.root.update_idletasks()
        
        while self.is_typing:
            # Generate random letter
            letter = random.choice(string.ascii_letters)
            
            # Type the letter
            pyautogui.write(letter, interval=0)
            
            # Increment counter
            self.chars_typed += 1
            self.count_var.set(f"Characters typed: {self.chars_typed}")
            
            # Decide if we should do a long pause
            if random.random() < self.long_pause_chance:
                pause_time = random.uniform(self.long_pause_min, self.long_pause_max)
                self.status_var.set(f"Paused for {pause_time:.1f} seconds...")
                self.root.update_idletasks()
                time.sleep(pause_time)
                self.status_var.set("Typing...")
                self.root.update_idletasks()
            else:
                # Regular typing delay
                time.sleep(random.uniform(self.pause_min/1000, self.pause_max/1000))
        
        # Enable delete button when typing stops
        if self.chars_typed > 0:
            self.delete_button.config(state=tk.NORMAL)
    
    def stop_typing(self):
        """Stop the typing process"""
        self.is_typing = False
        self.status_var.set("Stopped")
        
        # Update button states
        self.start_button.config(state=tk.NORMAL)
        self.stop_button.config(state=tk.DISABLED)
        
        # Wait for typing thread to finish
        if self.typing_thread and self.typing_thread.is_alive():
            self.typing_thread.join(1)
    
    def delete_typed(self):
        """Delete all typed characters using backspace"""
        if self.chars_typed <= 0:
            return
            
        # Disable buttons during deletion
        self.start_button.config(state=tk.DISABLED)
        self.delete_button.config(state=tk.DISABLED)
        
        self.status_var.set("Deleting...")
        self.root.update_idletasks()
        
        # Create a separate thread for deletion
        delete_thread = threading.Thread(target=self._delete_characters)
        delete_thread.daemon = True
        delete_thread.start()
    
    def _delete_characters(self):
        """Helper function to delete characters in a separate thread"""
        # Press backspace for each character typed
        for i in range(self.chars_typed):
            pyautogui.press('backspace')
            time.sleep(0.01)  # Small delay between backspaces
            
            # Update counter every 10 characters
            if i % 10 == 0:
                remaining = self.chars_typed - i
                self.count_var.set(f"Characters remaining: {remaining}")
                self.root.update_idletasks()
        
        # Reset counter and update status
        self.chars_typed = 0
        self.count_var.set("Characters typed: 0")
        self.status_var.set("Ready - Click Start then click in a text box")
        
        # Re-enable start button
        self.start_button.config(state=tk.NORMAL)
        self.delete_button.config(state=tk.DISABLED)
    
    def on_close(self):
        """Handle window close event"""
        self.stop_typing()
        self.root.destroy()
    
    def run(self):
        """Start the GUI main loop"""
        self.root.mainloop()

if __name__ == "__main__":
    bot = RandomTyperBot()
    bot.run()
