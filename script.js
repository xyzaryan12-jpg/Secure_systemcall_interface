// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Form validation
const contactForm = document.querySelector('.contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();

        // Get form inputs
        const name = this.querySelector('input[type="text"]').value.trim();
        const email = this.querySelector('input[type="email"]').value.trim();
        const message = this.querySelector('textarea').value.trim();

        // Basic validation
        if (!name || !email || !message) {
            alert('Please fill in all fields');
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert('Please enter a valid email address');
            return;
        }

        // Simulate form submission
        alert('Thank you for your message! We will get back to you soon.');
        this.reset();
    });
}

// Add scroll-based navbar styling
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        if (window.scrollY > 50) {
            navbar.style.backgroundColor = 'rgba(44, 62, 80, 0.95)';
        } else {
            navbar.style.backgroundColor = '#2c3e50';
        }
    }
});

// Add animation to feature cards on scroll
const observerOptions = {
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

document.querySelectorAll('.feature-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(card);
});

// Add animation for process steps
const processObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, {
    threshold: 0.1
});

document.querySelectorAll('.process-step').forEach(step => {
    processObserver.observe(step);
});

// System Call Execution
const syscallData = {
    open: {
        userCode: `int fd = open("example.txt", O_RDONLY);
if (fd == -1) {
    perror("Error opening file");
    return -1;
}`,
        kernelCode: `SYSCALL_DEFINE2(open, const char __user *, filename, int, flags)
{
    // 1. Validate input parameters
    if (!filename)
        return -EFAULT;
    
    // 2. Check file permissions
    if (!may_open(AT_FDCWD, filename, flags, 0))
        return -EACCES;
    
    // 3. Allocate file descriptor
    int fd = get_unused_fd_flags(flags);
    if (fd < 0)
        return fd;
    
    // 4. Open the file
    struct file *f = do_filp_open(AT_FDCWD, filename, flags, 0);
    if (IS_ERR(f)) {
        put_unused_fd(fd);
        return PTR_ERR(f);
    }
    
    // 5. Install file descriptor
    fd_install(fd, f);
    return fd;
}`,
        steps: [
            "User application calls open() with filename and flags",
            "System call interface validates parameters",
            "Context switch to kernel mode",
            "Kernel checks file permissions",
            "Kernel allocates file descriptor",
            "Kernel opens the file",
            "Kernel installs file descriptor",
            "Return to user space with file descriptor"
        ]
    },
    read: {
        userCode: `char buffer[1024];
ssize_t bytes_read = read(fd, buffer, sizeof(buffer));
if (bytes_read == -1) {
    perror("Error reading file");
    return -1;
}`,
        kernelCode: `SYSCALL_DEFINE3(read, unsigned int, fd, char __user *, buf, size_t, count)
{
    // 1. Validate file descriptor
    struct fd f = fdget_pos(fd);
    if (!f.file)
        return -EBADF;
    
    // 2. Check read permissions
    if (!(f.file->f_mode & FMODE_READ))
        return -EBADF;
    
    // 3. Perform the read operation
    ssize_t ret = vfs_read(f.file, buf, count, &f.file->f_pos);
    
    // 4. Release file descriptor
    fdput_pos(f);
    return ret;
}`,
        steps: [
            "User application calls read() with file descriptor and buffer",
            "System call interface validates parameters",
            "Context switch to kernel mode",
            "Kernel validates file descriptor",
            "Kernel checks read permissions",
            "Kernel performs read operation",
            "Kernel copies data to user buffer",
            "Return to user space with bytes read"
        ]
    },
    write: {
        userCode: `const char *data = "Hello, World!";
ssize_t bytes_written = write(fd, data, strlen(data));
if (bytes_written == -1) {
    perror("Error writing to file");
    return -1;
}`,
        kernelCode: `SYSCALL_DEFINE3(write, unsigned int, fd, const char __user *, buf, size_t, count)
{
    // 1. Validate file descriptor
    struct fd f = fdget_pos(fd);
    if (!f.file)
        return -EBADF;
    
    // 2. Check write permissions
    if (!(f.file->f_mode & FMODE_WRITE))
        return -EBADF;
    
    // 3. Perform the write operation
    ssize_t ret = vfs_write(f.file, buf, count, &f.file->f_pos);
    
    // 4. Release file descriptor
    fdput_pos(f);
    return ret;
}`,
        steps: [
            "User application calls write() with file descriptor and data",
            "System call interface validates parameters",
            "Context switch to kernel mode",
            "Kernel validates file descriptor",
            "Kernel checks write permissions",
            "Kernel performs write operation",
            "Kernel copies data from user buffer",
            "Return to user space with bytes written"
        ]
    },
    fork: {
        userCode: `pid_t pid = fork();
if (pid == -1) {
    perror("Error creating process");
    return -1;
} else if (pid == 0) {
    // Child process
    printf("Child process (PID: %d)\\n", getpid());
} else {
    // Parent process
    printf("Parent process (PID: %d, Child PID: %d)\\n", getpid(), pid);
}`,
        kernelCode: `SYSCALL_DEFINE0(fork)
{
    // 1. Check process limits
    if (nr_threads >= max_threads)
        return -EAGAIN;
    
    // 2. Create new process
    struct task_struct *p = copy_process(CLONE_FORK, 0, 0, NULL, NULL, 0);
    if (IS_ERR(p))
        return PTR_ERR(p);
    
    // 3. Start the new process
    wake_up_new_task(p);
    
    // 4. Return child PID to parent, 0 to child
    return task_pid_vnr(p);
}`,
        steps: [
            "User application calls fork()",
            "System call interface validates parameters",
            "Context switch to kernel mode",
            "Kernel checks process limits",
            "Kernel creates new process",
            "Kernel copies parent process state",
            "Kernel starts new process",
            "Return to user space with appropriate PID"
        ]
    },
    exec: {
        userCode: `char *args[] = {"/bin/ls", "-l", NULL};
execvp(args[0], args);
perror("Error executing program");
return -1;`,
        kernelCode: `SYSCALL_DEFINE3(execve, const char __user *, filename,
    const char __user *const __user *, argv,
    const char __user *const __user *, envp)
{
    // 1. Validate parameters
    if (!filename || !argv || !envp)
        return -EFAULT;
    
    // 2. Load the new program
    struct linux_binprm *bprm = prepare_binprm(filename, argv, envp);
    if (IS_ERR(bprm))
        return PTR_ERR(bprm);
    
    // 3. Execute the program
    int ret = search_binary_handler(bprm);
    if (ret < 0)
        return ret;
    
    // 4. Clean up and return
    return 0;
}`,
        steps: [
            "User application calls exec() with program path and arguments",
            "System call interface validates parameters",
            "Context switch to kernel mode",
            "Kernel validates program path",
            "Kernel loads new program",
            "Kernel prepares execution environment",
            "Kernel starts new program",
            "Old program is replaced (no return)"
        ]
    },
    socket: {
        userCode: `int sockfd = socket(AF_INET, SOCK_STREAM, 0);
if (sockfd == -1) {
    perror("Error creating socket");
    return -1;
}`,
        kernelCode: `SYSCALL_DEFINE3(socket, int, family, int, type, int, protocol)
{
    // 1. Validate parameters
    if (family < 0 || family >= NPROTO)
        return -EAFNOSUPPORT;
    
    // 2. Create socket
    struct socket *sock;
    int ret = sock_create(family, type, protocol, &sock);
    if (ret < 0)
        return ret;
    
    // 3. Allocate file descriptor
    int fd = get_unused_fd_flags(O_RDWR);
    if (fd < 0) {
        sock_release(sock);
        return fd;
    }
    
    // 4. Install socket
    fd_install(fd, sock->file);
    return fd;
}`,
        steps: [
            "User application calls socket() with family, type, and protocol",
            "System call interface validates parameters",
            "Context switch to kernel mode",
            "Kernel validates socket parameters",
            "Kernel creates socket structure",
            "Kernel allocates file descriptor",
            "Kernel installs socket",
            "Return to user space with socket descriptor"
        ]
    }
};

let currentStep = 0;
let currentSyscall = null;

// System call controls
const runSyscallBtn = document.getElementById('run-syscall');
const stepForwardBtn = document.getElementById('step-forward');
const stepBackBtn = document.getElementById('step-back');

if (runSyscallBtn) {
    runSyscallBtn.addEventListener('click', () => {
        const select = document.getElementById('syscall-select');
        const selectedSyscall = select.value;

        if (!selectedSyscall) {
            alert('Please select a system call first');
            return;
        }

        currentSyscall = selectedSyscall;
        currentStep = 0;

        // Reset visualization
        document.getElementById('user-code').textContent = syscallData[selectedSyscall].userCode;
        document.getElementById('kernel-code').textContent = '';
        document.getElementById('execution-log').innerHTML = '';

        // Enable/disable controls
        stepBackBtn.disabled = true;
        stepForwardBtn.disabled = false;

        // Add first log entry
        addLogEntry(syscallData[selectedSyscall].steps[0]);
    });
}

if (stepForwardBtn) {
    stepForwardBtn.addEventListener('click', () => {
        if (!currentSyscall || currentStep >= syscallData[currentSyscall].steps.length - 1) return;

        currentStep++;

        // Update kernel code display
        if (currentStep >= 2) { // Start showing kernel code at step 3
            const kernelCode = syscallData[currentSyscall].kernelCode;
            const lines = kernelCode.split('\n');
            const visibleLines = lines.slice(0, currentStep - 1);
            document.getElementById('kernel-code').textContent = visibleLines.join('\n');
        }

        // Add log entry
        addLogEntry(syscallData[currentSyscall].steps[currentStep]);

        // Update controls
        stepBackBtn.disabled = false;
        if (currentStep >= syscallData[currentSyscall].steps.length - 1) {
            stepForwardBtn.disabled = true;
        }
    });
}

if (stepBackBtn) {
    stepBackBtn.addEventListener('click', () => {
        if (!currentSyscall || currentStep <= 0) return;

        currentStep--;

        // Update kernel code display
        if (currentStep >= 2) {
            const kernelCode = syscallData[currentSyscall].kernelCode;
            const lines = kernelCode.split('\n');
            const visibleLines = lines.slice(0, currentStep - 1);
            document.getElementById('kernel-code').textContent = visibleLines.join('\n');
        } else {
            document.getElementById('kernel-code').textContent = '';
        }

        // Remove last log entry
        const log = document.getElementById('execution-log');
        if (log.lastChild) {
            log.removeChild(log.lastChild);
        }

        // Update controls
        stepForwardBtn.disabled = false;
        if (currentStep <= 0) {
            stepBackBtn.disabled = true;
        }
    });
}

function addLogEntry(message) {
    const log = document.getElementById('execution-log');
    const entry = document.createElement('p');
    // FIXED: use template literal with backticks
    entry.textContent = `Step ${currentStep + 1}: ${message}`;
    entry.classList.add('highlight');
    log.appendChild(entry);
    log.scrollTop = log.scrollHeight;
}

// Code Editor and Playground
const editor = document.getElementById('code-editor');
const codeOutput = document.getElementById('code-output');
const runButton = document.getElementById('run-code');
const resetButton = document.getElementById('reset-code');

// Initialize code editor with default content
const defaultCode = `#include <stdio.h>
#include <fcntl.h>
#include <unistd.h>

int main() {
    // Example: Open and read a file
    int fd = open("example.txt", O_RDONLY);
    if (fd == -1) {
        perror("Error opening file");
        return 1;
    }
    
    char buffer[1024];
    ssize_t bytes_read = read(fd, buffer, sizeof(buffer));
    if (bytes_read == -1) {
        perror("Error reading file");
        close(fd);
        return 1;
    }
    
    printf("Read %zd bytes from file\\n", bytes_read);
    close(fd);
    return 0;
}`;

if (editor) {
    editor.textContent = defaultCode;
}

// Syntax highlighting function
function highlightSyntax(code) {
    const keywords = ['int', 'char', 'if', 'else', 'return', 'main', 'include'];
    const types = ['ssize_t', 'size_t'];
    const functions = ['open', 'read', 'write', 'close', 'printf', 'perror'];

    let highlighted = code
        .replace(/(\/\/.*$)/gm, '<span class="comment">$1</span>')
        .replace(/(#include.*$)/gm, '<span class="preprocessor">$1</span>')
        // FIXED: proper RegExp construction using strings
        .replace(new RegExp(`\\b(${keywords.join('|')})\\b`, 'g'), '<span class="keyword">$1</span>')
        .replace(new RegExp(`\\b(${types.join('|')})\\b`, 'g'), '<span class="type">$1</span>')
        .replace(new RegExp(`\\b(${functions.join('|')})\\b`, 'g'), '<span class="function">$1</span>')
        .replace(/(["'].*?["'])/g, '<span class="string">$1</span>');

    return highlighted;
}

// Update syntax highlighting when code changes
if (editor) {
    editor.addEventListener('input', () => {
        const plain = editor.textContent;
        editor.innerHTML = highlightSyntax(plain);
    });
}

// Run code button handler
if (runButton) {
    runButton.addEventListener('click', () => {
        const code = editor ? editor.textContent : '';
        codeOutput.innerHTML = 'Running system calls...<br>';

        // Simulate system call execution
        setTimeout(() => {
            codeOutput.innerHTML += 'System call: open()<br>';
            animateLine('line1');

            setTimeout(() => {
                codeOutput.innerHTML += 'System call: read()<br>';
                animateLine('line2');

                setTimeout(() => {
                    codeOutput.innerHTML += 'System call: close()<br>';
                    animateLine('line3');

                    setTimeout(() => {
                        codeOutput.innerHTML += '<br>Execution completed successfully!';
                    }, 1000);
                }, 1000);
            }, 1000);
        }, 1000);
    });
}

// Reset code button handler
if (resetButton && editor) {
    resetButton.addEventListener('click', () => {
        editor.textContent = defaultCode;
        editor.innerHTML = highlightSyntax(defaultCode);
        codeOutput.innerHTML = '';
        resetLines();
    });
}

// Visual diagram animation
function animateLine(lineId) {
    const line = document.getElementById(lineId);
    if (line) {
        line.classList.add('active');
    }
}

function resetLines() {
    document.querySelectorAll('.line').forEach(line => {
        line.classList.remove('active');
        line.style.width = '0';
    });
}

// Challenges functionality
document.querySelectorAll('.start-challenge').forEach(button => {
    button.addEventListener('click', function() {
        const challenge = this.closest('.challenge-card');
        const title = challenge.querySelector('h3').textContent;

        // Update editor with challenge template
        let template = '';
        switch(title) {
            case 'File Operations':
                template = `#include <stdio.h>
#include <fcntl.h>
#include <unistd.h>

int main() {
    // TODO: Implement file operations
    // 1. Open a file
    // 2. Read from the file
    // 3. Write to the file
    // 4. Close the file
    
    return 0;
}`;
                break;
            case 'Process Management':
                template = `#include <stdio.h>
#include <unistd.h>
#include <sys/types.h>
#include <sys/wait.h>

int main() {
    // TODO: Implement process management
    // 1. Create a child process
    // 2. Handle parent and child execution
    // 3. Wait for child process
    
    return 0;
}`;
                break;
            case 'Network Communication':
                template = `#include <stdio.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>

int main() {
    // TODO: Implement network communication
    // 1. Create a socket
    // 2. Bind to an address
    // 3. Listen for connections
    // 4. Accept connections
    
    return 0;
}`;
                break;
        }

        if (editor) {
            editor.textContent = template;
            editor.innerHTML = highlightSyntax(template);
        }
        if (codeOutput) codeOutput.innerHTML = '';
        resetLines();

        // Scroll to playground section
        const playground = document.getElementById('playground');
        if (playground) {
            playground.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Update the system call selector in HTML
document.addEventListener('DOMContentLoaded', () => {
    const select = document.getElementById('syscall-select');
    if (!select) return;

    Object.keys(syscallData).forEach(syscall => {
        const option = document.createElement('option');
        option.value = syscall;
        // FIXED: proper template literal
        option.textContent = `${syscall}() - ${getSyscallDescription(syscall)}`;
        select.appendChild(option);
    });
});

function getSyscallDescription(syscall) {
    const descriptions = {
        open: "Open a file",
        read: "Read from a file",
        write: "Write to a file",
        fork: "Create a new process",
        exec: "Execute a program",
        socket: "Create a network socket"
    };
    return descriptions[syscall] || "Unknown system call";
}
